// app/api/admin/reset-booths/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    // 🔒 운영(prod)에서는 완전 차단
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

    // 🔁 Prisma는 핸들러 안에서 동적 import (빌드 시 DB 접근 방지)
    const { prisma } = await import("@/lib/prisma");

    try {
        // 부스 초기 비번 1234
        const passwordHash = await bcrypt.hash("1234", 10);

        // 모든 부스 초기화
        await prisma.booth.updateMany({
            data: {
                passwordHash,
                balance: 0,
            },
        });

        return NextResponse.json({ ok: true, message: "부스 리셋 완료" });
    } catch (error) {
        console.error("reset-booths error", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
