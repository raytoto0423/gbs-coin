// app/api/admin/reset-transactions/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export async function POST() {
    const session = await auth();

    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { message: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    try {
        const result = await prisma.transaction.deleteMany({});

        return NextResponse.json({
            ok: true,
            message: `전체 거래 내역이 삭제되었습니다. (총 ${result.count}건)`,
            count: result.count,
        });
    } catch (error) {
        console.error("reset-transactions error", error);
        return NextResponse.json(
            { message: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
