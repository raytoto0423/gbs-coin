// app/api/admin/reset-booths/route.ts
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
        const result = await prisma.booth.updateMany({
            data: {
                balance: 0,
            },
        });

        return NextResponse.json({
            ok: true,
            message: "모든 부스 잔액이 0으로 초기화되었습니다.",
            count: result.count,
        });
    } catch (error) {
        console.error("reset-booths error", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
