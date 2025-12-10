// app/api/dev/seed-booths/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// 빌드 시에 이 라우트를 정적으로 건드리지 말라는 힌트
export const dynamic = "force-dynamic";

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

// POST /api/dev/seed-booths?key=DEV_SEED_KEY
export async function POST(req: NextRequest) {
    // 🔒 운영 환경에서는 아예 막기
    if (process.env.NODE_ENV === "production") {
        return new NextResponse("Not allowed in production", { status: 403 });
    }

    // 🔑 간단한 키 체크 (env 에 DEV_SEED_KEY 가 있어야 함)
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const expectedKey = process.env.DEV_SEED_KEY;

    if (!expectedKey || key !== expectedKey) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // 🔁 Prisma 는 핸들러 안에서 동적 import → 모듈 로드시 DB 안 건드림
    const { prisma } = await import("@/lib/prisma");

    try {
        // 부스 비밀번호 공통: 1234
        const password = "1234";
        const hash = await bcrypt.hash(password, 10);

        // 각 반마다 upsert
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
    } catch (error) {
        console.error("seed-booths error", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
