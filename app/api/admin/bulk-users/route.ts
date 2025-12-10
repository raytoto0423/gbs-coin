// app/api/admin/bulk-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

type BulkMode = "SET" | "ADD" | "CLEAR";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { error: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    const body = await req.json().catch(() => null) as
        | { userIds?: string[]; mode?: BulkMode; amount?: number }
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

    // 관리자 / 부스 계정은 항상 제외
    const targets = await prisma.user.findMany({
        where: {
            id: { in: userIds },
            NOT: [
                { email: ADMIN_EMAIL },
                { role: "BOOTH" },
            ],
        },
    });

    if (targets.length === 0) {
        return NextResponse.json(
            { error: "처리할 유저가 없습니다." },
            { status: 400 }
        );
    }

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
    } else if (mode === "CLEAR") {
        await prisma.user.updateMany({
            where: { id: { in: targets.map((u) => u.id) } },
            data: { balance: 0 },
        });
    }

    const updatedUsers = await prisma.user.findMany({
        where: { id: { in: targets.map((u) => u.id) } },
        select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            classRoom: true,
            balance: true,
        },
    });

    return NextResponse.json({
        ok: true,
        count: updatedUsers.length,
        users: updatedUsers,
    });
}
