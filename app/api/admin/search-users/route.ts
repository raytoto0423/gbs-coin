// app/api/admin/search-users/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export async function GET(req: NextRequest) {
    const session = await auth();

    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { message: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (!q) {
        return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
        where: {
            AND: [
                { email: { not: ADMIN_EMAIL } }, // 관리자 제외
                { email: { not: { endsWith: "@booth.local" } } }, // 부스 계정 제외
                {
                    OR: [
                        { name: { contains: q } },
                        { email: { contains: q } },
                    ],
                },
            ],
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            grade: true,
            classRoom: true,
            classRole: true,
            balance: true,
        },
        orderBy: [
            { grade: "asc" },
            { classRoom: "asc" },
            { name: "asc" },
        ],
    });

    return NextResponse.json({ users });
}
