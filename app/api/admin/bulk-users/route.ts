// app/api/admin/bulk-users/route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";          // ✅ Prisma는 Node 런타임에서만
export const dynamic = "force-dynamic";   // ✅ 항상 동적 처리

const ADMIN_EMAIL = "dhhwang423@gmail.com";

type BulkMode = "SET" | "ADD" | "CLEAR";

export async function POST(req: Request) {
    // 🔥 여기서만 auth / prisma 동적 import (빌드 타임에는 실행 X)
    const [{ auth }, { prisma }] = await Promise.all([
        import("@/auth"),
        import("@/lib/prisma"),
    ]);

    const session = await auth();
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { error: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    const body = (await req.json().catch(() => null)) as
        | {
        userIds?: string[];
        mode?: BulkMode;
        amount?: number;
    }
        | null;

    if (!body?.userIds || body.userIds.length === 0 || !body.mode) {
        return NextResponse.json(
            { error: "userIds와 mode가 필요합니다." },
            { status: 400 }
        );
    }

    const { userIds, mode, amount } = body;

    if ((mode === "SET" || mode === "ADD") && typeof amount !== "number") {
        return NextResponse.json(
            { error: "해당 모드에서는 amount가 필요합니다." },
            { status: 400 }
        );
    }

    // 관리자 계정은 실수로 포함돼도 건드리지 않도록 필터
    const targets = await prisma.user.findMany({
        where: {
            id: { in: userIds },
            NOT: { email: ADMIN_EMAIL },
        },
    });

    if (targets.length === 0) {
        return NextResponse.json(
            { error: "처리할 유저가 없습니다." },
            { status: 400 }
        );
    }

    // 모드에 따라 잔액 계산
    if (mode === "SET") {
        if ((amount as number) < 0) {
            return NextResponse.json(
                { error: "잔액은 0 이상이어야 합니다." },
                { status: 400 }
            );
        }

        await prisma.user.updateMany({
            where: { id: { in: targets.map((u) => u.id) } },
            data: { balance: amount as number },
        });
    } else if (mode === "ADD") {
        await prisma.user.updateMany({
            where: { id: { in: targets.map((u) => u.id) } },
            data: {
                balance: {
                    increment: amount as number,
                },
            },
        });

        // 음수 방지는 지금 로직상 허용 (필요하면 여기서 한 번 더 체크 가능)
    } else if (mode === "CLEAR") {
        await prisma.user.updateMany({
            where: { id: { in: targets.map((u) => u.id) } },
            data: { balance: 0 },
        });
    }

    // 갱신된 값 다시 읽어서 프론트에 반환
    const updatedUsers = await prisma.user.findMany({
        where: { id: { in: targets.map((u) => u.id) } },
        select: { id: true, balance: true },
    });

    return NextResponse.json({
        ok: true,
        users: updatedUsers,
    });
}
