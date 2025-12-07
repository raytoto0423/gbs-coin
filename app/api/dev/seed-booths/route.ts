// app/api/dev/seed-booth/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

const CLASSES = [
    "1-1",
    "1-2",
    "1-3",
    "1-4",
    "1-5",
    "2-1",
    "2-2",
    "2-3",
    "2-4",
    "2-5",
    "3-1",
    "3-2",
    "3-3",
    "3-4",
    "3-5",
];

export async function GET() {
    const passwordHash = await hash("1234", 10); // 임시 비밀번호

    for (const id of CLASSES) {
        await prisma.booth.upsert({
            where: { id },
            update: {},
            create: {
                id,
                name: `${id} 부스`,
                passwordHash,
            },
        });
    }

    return NextResponse.json({
        ok: true,
        message: "부스 계정들이 생성되었습니다. (비번: 1234)",
    });
}
