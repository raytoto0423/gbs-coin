// app/api/admin/adjust-user/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "관리자만 사용할 수 있습니다." }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as {
        userId?: string;
        delta?: number;
    } | null;

    if (!body?.userId || typeof body.delta !== "number") {
        return NextResponse.json({ error: "userId와 delta가 필요합니다." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!user) {
        return NextResponse.json({ error: "해당 유저를 찾을 수 없습니다." }, { status: 404 });
    }

    const newBalance = user.balance + body.delta;
    // 음수 허용 여부는 정책에 따라
    if (newBalance < 0) {
        return NextResponse.json({ error: "잔액이 음수가 될 수 없습니다." }, { status: 400 });
    }

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { balance: newBalance },
    });

    // 선택: Transaction 로그도 남기고 싶으면 (스키마에 맞게 수정)
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
