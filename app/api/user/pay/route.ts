// app/api/user/pay/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json(
            { message: "로그인이 필요합니다." },
            { status: 401 }
        );
    }

    // 부스 계정은 결제자가 될 수 없음
    if (session.user.role === "BOOTH") {
        return NextResponse.json(
            { message: "부스 계정은 결제할 수 없습니다." },
            { status: 403 }
        );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.activityId) {
        return NextResponse.json(
            { message: "activityId가 필요합니다." },
            { status: 400 }
        );
    }

    const activityId = body.activityId as string;

    const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        include: { booth: true },
    });

    if (!activity || !activity.booth) {
        return NextResponse.json(
            { message: "해당 활동을 찾을 수 없습니다." },
            { status: 404 }
        );
    }

    const userId = session.user.id;
    const boothId = activity.boothId;
    const price = activity.price;
    const type = activity.type; // "PAY" | "REWARD"

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 최신 유저/부스 정보 조회 (학년/반 포함)
            const user = await tx.user.findUnique({
                where: { id: userId },
            });
            const booth = await tx.booth.findUnique({
                where: { id: boothId },
            });

            if (!user || !booth) {
                throw new Error("USER_OR_BOOTH_NOT_FOUND");
            }

            // 🔒 자기 반 부스 결제 막기 (PAY일 때만)
            if (type === "PAY") {
                const userGrade = user.grade ?? null;
                const userClassRoom = user.classRoom ?? null;

                let boothGrade = booth.grade ?? null;
                let boothClassRoom = booth.classRoom ?? null;

                // 부스에 grade/classRoom이 안 채워져 있으면 id에서 추론 (예: "1-3")
                if (boothGrade == null || boothClassRoom == null) {
                    const m = booth.id.match(/^(\d+)-(\d+)$/);
                    if (m) {
                        boothGrade = parseInt(m[1], 10);
                        boothClassRoom = parseInt(m[2], 10);
                    }
                }

                if (
                    userGrade != null &&
                    userClassRoom != null &&
                    boothGrade != null &&
                    boothClassRoom != null &&
                    userGrade === boothGrade &&
                    userClassRoom === boothClassRoom
                ) {
                    // 동일 학년/반 부스 → 결제 금지
                    throw new Error("SAME_CLASS_PAYMENT_FORBIDDEN");
                }
            }

            // 💸 실제 잔액 이동 로직
            if (type === "PAY") {
                // 학생/선생님 → 부스
                if (user.balance < price) {
                    throw new Error("INSUFFICIENT_USER_BALANCE");
                }

                const updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: { balance: user.balance - price },
                });

                const updatedBooth = await tx.booth.update({
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

                return {
                    userBalanceAfter: updatedUser.balance,
                    boothBalanceAfter: updatedBooth.balance,
                };
            } else {
                // type === "REWARD"
                // 부스 → 학생/선생님
                if (booth.balance < price) {
                    throw new Error("INSUFFICIENT_BOOTH_BALANCE");
                }

                const updatedBooth = await tx.booth.update({
                    where: { id: boothId },
                    data: { balance: booth.balance - price },
                });

                const updatedUser = await tx.user.update({
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

                return {
                    userBalanceAfter: updatedUser.balance,
                    boothBalanceAfter: updatedBooth.balance,
                };
            }
        });

        return NextResponse.json({
            ok: true,
            message:
                type === "PAY"
                    ? "결제가 완료되었습니다."
                    : "코인이 지급되었습니다.",
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
            if (e.message === "SAME_CLASS_PAYMENT_FORBIDDEN") {
                return NextResponse.json(
                    { message: "자기 반 부스에서는 결제할 수 없습니다." },
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
