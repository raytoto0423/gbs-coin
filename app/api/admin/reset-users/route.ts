// app/api/admin/reset-users/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export async function POST(_req: Request) {
    const session = await auth();

    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { message: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    try {
        const result = await prisma.user.updateMany({
            // 관리자 본인 계정은 잔액 0으로 건드리지 않도록 필터
            where: {
                NOT: {
                    email: ADMIN_EMAIL,
                },
            },
            data: {
                balance: 0,
            },
        });

        return NextResponse.json({
            ok: true,
            message: `관리자를 제외한 모든 유저 잔액이 0으로 초기화되었습니다.`,
            count: result.count,
        });
    } catch (error) {
        console.error("reset-users error", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
