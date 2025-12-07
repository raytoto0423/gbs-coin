// app/api/admin/adjust-user/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export async function POST(req: Request) {
    const session = await auth();

    // 🔐 관리자 이메일이 아니면 거절
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { error: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    const body = (await req.json().catch(() => null)) as
        | {
        userId?: string;
        delta?: number;
    }
        | null;

    if (!body?.userId || typeof body.delta !== "number") {
        return NextResponse.json(
            { error: "userId와 delta가 필요합니다." },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: body.userId },
    });

    if (!user) {
        return NextResponse.json(
            { error: "해당 유저를 찾을 수 없습니다." },
            { status: 404 }
        );
    }

    // 🔒 관리자 계정 잔액은 보호 (실수 방지)
    if (user.email === ADMIN_EMAIL) {
        return NextResponse.json(
            { error: "관리자 계정 잔액은 수정할 수 없습니다." },
            { status: 400 }
        );
    }

    const newBalance = user.balance + body.delta;

    // 음수 허용 정책: 지금은 음수 금지
    if (newBalance < 0) {
        return NextResponse.json(
            { error: "잔액이 음수가 될 수 없습니다." },
            { status: 400 }
        );
    }

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { balance: newBalance },
    });

    // 선택: Transaction 로그
    await prisma.transaction.create({
        data: {
            fromUserId: null, // 관리자
            toUserId: user.id,
            toBoothId: null,
            amount: body.delta,
            title: body.delta > 0 ? "관리자 충전" : "관리자 차감",
        },
    });

    return NextResponse.json({ ok: true, balance: updated.balance });
}
