// app/api/admin/adjust-booth/route.ts
export const runtime = "nodejs";          // ✅ Prisma는 Node 런타임에서만
export const dynamic = "force-dynamic";   // ✅ 항상 동적 처리

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "관리자만 사용할 수 있습니다." }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as {
        boothId?: string;
        delta?: number;
    } | null;

    if (!body?.boothId || typeof body.delta !== "number") {
        return NextResponse.json({ error: "boothId와 delta가 필요합니다." }, { status: 400 });
    }

    const booth = await prisma.booth.findUnique({ where: { id: body.boothId } });
    if (!booth) {
        return NextResponse.json({ error: "해당 부스를 찾을 수 없습니다." }, { status: 404 });
    }

    const newBalance = booth.balance + body.delta;
    if (newBalance < 0) {
        return NextResponse.json({ error: "잔액이 음수가 될 수 없습니다." }, { status: 400 });
    }

    const updated = await prisma.booth.update({
        where: { id: booth.id },
        data: { balance: newBalance },
    });

    // 필요하면 부스용 Transaction 로그도 남김
    await prisma.transaction.create({
        data: {
            fromUserId: null,
            toUserId: null,
            toBoothId: booth.id,
            amount: body.delta,
            title: body.delta > 0 ? "관리자 부스 충전" : "관리자 부스 차감",
        },
    });

    return NextResponse.json({ ok: true, balance: updated.balance });
}
