// app/api/admin/adjust-booths/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

type Mode = "SET" | "ADD" | "CLEAR";

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { message: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    const body = await req.json().catch(() => null) as
        | { boothId?: string; mode?: Mode; amount?: number }
        | null;

    const boothId = body?.boothId?.trim();
    const mode = body?.mode;
    const amount = body?.amount;

    if (!boothId || !mode) {
        return NextResponse.json(
            { message: "boothId와 mode가 필요합니다." },
            { status: 400 }
        );
    }

    if ((mode === "SET" || mode === "ADD") && typeof amount !== "number") {
        return NextResponse.json(
            { message: "SET/ADD 모드에서는 amount가 필요합니다." },
            { status: 400 }
        );
    }

    const booth = await prisma.booth.findUnique({ where: { id: boothId } });
    if (!booth) {
        return NextResponse.json(
            { message: `부스 ${boothId} 를 찾을 수 없습니다.` },
            { status: 404 }
        );
    }

    let newBalance = booth.balance;

    if (mode === "CLEAR") {
        newBalance = 0;
    } else if (mode === "SET") {
        if ((amount as number) < 0) {
            return NextResponse.json(
                { message: "잔액은 0 이상이어야 합니다." },
                { status: 400 }
            );
        }
        newBalance = amount as number;
    } else if (mode === "ADD") {
        newBalance = booth.balance + (amount as number);
    }

    const updated = await prisma.booth.update({
        where: { id: boothId },
        data: { balance: newBalance },
        select: {
            id: true,
            name: true,
            balance: true,
            grade: true,
            classRoom: true,
        },
    });

    return NextResponse.json({
        ok: true,
        booth: updated,
    });
}
