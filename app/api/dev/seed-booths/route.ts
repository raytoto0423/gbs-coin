// app/api/dev/seed-booths/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 학년/반 목록
const booths = [
    { id: "1-1", name: "1학년 1반" },
    { id: "1-2", name: "1학년 2반" },
    { id: "1-3", name: "1학년 3반" },
    { id: "1-4", name: "1학년 4반" },
    { id: "1-5", name: "1학년 5반" },
    { id: "2-1", name: "2학년 1반" },
    { id: "2-2", name: "2학년 2반" },
    { id: "2-3", name: "2학년 3반" },
    { id: "2-4", name: "2학년 4반" },
    { id: "2-5", name: "2학년 5반" },
    { id: "3-1", name: "3학년 1반" },
    { id: "3-2", name: "3학년 2반" },
    { id: "3-3", name: "3학년 3반" },
    { id: "3-4", name: "3학년 4반" },
    { id: "3-5", name: "3학년 5반" },
];

export async function GET(request: Request) {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    // 🔐 안전장치: 비밀 키 안 맞으면 거절
    if (!key || key !== process.env.DEV_SEED_KEY) {
        return NextResponse.json(
            { message: "권한이 없습니다." },
            { status: 401 }
        );
    }

    const password = "1234";
    const hash = await bcrypt.hash(password, 10);

    for (const b of booths) {
        await prisma.booth.upsert({
            where: { id: b.id },
            update: {
                name: b.name,
                passwordHash: hash,
            },
            create: {
                id: b.id,
                name: b.name,
                passwordHash: hash,
            },
        });
    }

    return NextResponse.json({
        ok: true,
        message: "부스 초기화 완료 (비밀번호 1234)",
        count: booths.length,
    });
}
