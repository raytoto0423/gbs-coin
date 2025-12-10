// app/api/admin/adjust-user/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

type Mode = "SET" | "ADD" | "CLEAR";

export async function POST(req: Request) {
    const session = await auth();

    // 관리자 체크
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { message: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    const body = (await req.json().catch(() => null)) as
        | {
        email?: string;
        userId?: string;
        mode?: Mode;
        amount?: number;
    }
        | null;

    const email = body?.email?.trim();
    const userId = body?.userId?.trim();
    const mode = body?.mode;
    const amount = body?.amount;

    if (!mode) {
        return NextResponse.json(
            { message: "mode(SET/ADD/CLEAR)가 필요합니다." },
            { status: 400 }
        );
    }

    if (!email && !userId) {
        return NextResponse.json(
            { message: "email 또는 userId 중 하나는 필요합니다." },
            { status: 400 }
        );
    }

    if ((mode === "SET" || mode === "ADD") && typeof amount !== "number") {
        return NextResponse.json(
            { message: "SET/ADD 모드에서는 amount(숫자)가 필요합니다." },
            { status: 400 }
        );
    }

    // 유저 찾기 (이메일 우선)
    const user = await prisma.user.findFirst({
        where: {
            ...(email ? { email } : {}),
            ...(userId ? { id: userId } : {}),
        },
    });

    if (!user) {
        return NextResponse.json(
            { message: "해당 유저를 찾을 수 없습니다." },
            { status: 404 }
        );
    }

    // 관리자 본인 잔액은 건드리지 않기
    if (user.email === ADMIN_EMAIL) {
        return NextResponse.json(
            { message: "관리자 계정의 잔액은 변경할 수 없습니다." },
            { status: 400 }
        );
    }

    let newBalance = user.balance;

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
        newBalance = user.balance + (amount as number);
    }

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { balance: newBalance },
        select: {
            id: true,
            name: true,
            email: true,
            balance: true,
            grade: true,
            classRoom: true,
            classRole: true,
        },
    });

    return NextResponse.json({
        ok: true,
        user: updated,
    });
}
