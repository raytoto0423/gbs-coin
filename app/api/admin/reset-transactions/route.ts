// app/api/admin/reset-transactions/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    // 🔒 운영(prod)에서는 막기
    if (process.env.NODE_ENV === "production") {
        return new NextResponse("Not allowed in production", { status: 403 });
    }

    // 🔑 키 인증
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const expectedKey = process.env.DEV_SEED_KEY;

    if (!expectedKey || key !== expectedKey) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { prisma } = await import("@/lib/prisma");

    try {
        // 모든 거래기록 삭제
        await prisma.transaction.deleteMany();

        return NextResponse.json({
            ok: true,
            message: "거래 기록 모두 삭제됨",
        });
    } catch (error) {
        console.error("reset-transactions error", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
