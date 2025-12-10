// app/api/dev/seed-booths/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 학년/반 목록 (기존 로직 그대로 유지)
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

// 실제 시드 로직을 함수로 묶어두고 GET/POST 둘 다에서 호출
async function runSeed(req: Request) {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    // 🔑 .env 의 DEV_SEED_KEY (없으면 기존 값과 맞춰서 기본값)
    const expectedKey = process.env.DEV_SEED_KEY ?? "gbs-seed-1234";

    if (key !== expectedKey) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const password = "1234";
        const hash = await bcrypt.hash(password, 10);

        for (const b of booths) {
            const [gradeStr, classStr] = b.id.split("-");
            const grade = Number(gradeStr);
            const classRoom = Number(classStr);

            await prisma.booth.upsert({
                where: { id: b.id },
                update: {
                    name: b.name,
                    passwordHash: hash,
                    passwordPlain: password, // 🔥 관리자용 평문
                    grade,
                    classRoom,
                },
                create: {
                    id: b.id,
                    name: b.name,
                    passwordHash: hash,
                    passwordPlain: password, // 🔥 관리자용 평문
                    grade,
                    classRoom,
                    balance: 0,
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

// 🔥 이제 GET / POST 둘 다 허용 (405 안 뜸)
export async function GET(req: Request) {
    return runSeed(req);
}

export async function POST(req: Request) {
    return runSeed(req);
}
