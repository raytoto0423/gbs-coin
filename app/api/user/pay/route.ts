// app/api/user/pay/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }

    // 부스 계정은 결제자가 될 수 없음
    if (session.user.role === "BOOTH") {
        return NextResponse.json({ message: "부스 계정은 결제할 수 없습니다." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.activityId) {
        return NextResponse.json({ message: "activityId가 필요합니다." }, { status: 400 });
    }

    const activityId = body.activityId as string;

    const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: { booth: true },
    });

    if (!activity || !activity.booth) {
        return NextResponse.json({ message: "해당 활동을 찾을 수 없습니다." }, { status: 404 });
    }

    const userId = session.user.id;
    const boothId = activity.boothId;
    const price = activity.price;
    const type = activity.type; // "PAY" | "REWARD"

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 최신 유저/부스 정보 조회
            const user = await tx.user.findUnique({ where: { id: userId } });
            const booth = await tx.booth.findUnique({ where: { id: boothId } });

            if (!user || !booth) {
                throw new Error("USER_OR_BOOTH_NOT_FOUND");
            }

            if (type === "PAY") {
                // 학생/선생님 → 부스
                if (user.balance < price) {
                    throw new Error("INSUFFICIENT_USER_BALANCE");
                }

                await tx.user.update({
                    where: { id: userId },
                    data: { balance: user.balance - price },
                });

                await tx.booth.update({
                    where: { id: boothId },
                    data: { balance: booth.balance + price },
                });

                await tx.transaction.create({
                    data: {
                        amount: price,
                        title: activity.title,
                        fromUserId: userId,
                        toBoothId: boothId,
                        activityId: activity.id,
                    },
                });
            } else {
                // type === "REWARD"
                // 부스 → 학생/선생님
                if (booth.balance < price) {
                    throw new Error("INSUFFICIENT_BOOTH_BALANCE");
                }

                await tx.booth.update({
                    where: { id: boothId },
                    data: { balance: booth.balance - price },
                });

                await tx.user.update({
                    where: { id: userId },
                    data: { balance: user.balance + price },
                });

                await tx.transaction.create({
                    data: {
                        amount: price,
                        title: activity.title,
                        fromBoothId: boothId,
                        toUserId: userId,
                        activityId: activity.id,
                    },
                });
            }

            return {
                userBalanceAfter:
                    type === "PAY" ? undefined : undefined, // 필요하면 나중에 더 넣자
            };
        });

        return NextResponse.json({
            ok: true,
            message: type === "PAY" ? "결제가 완료되었습니다." : "코인이 지급되었습니다.",
            ...result,
        });
    } catch (e: any) {
        if (e instanceof Error) {
            if (e.message === "INSUFFICIENT_USER_BALANCE") {
                return NextResponse.json(
                    { message: "학생/선생님의 잔액이 부족합니다." },
                    { status: 400 }
                );
            }
            if (e.message === "INSUFFICIENT_BOOTH_BALANCE") {
                return NextResponse.json(
                    { message: "부스 잔액이 부족합니다." },
                    { status: 400 }
                );
            }
        }

        console.error("pay error", e);
        return NextResponse.json(
            { message: "결제 처리 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
