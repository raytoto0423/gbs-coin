// app/api/admin/search-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { error: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    const body = await req.json().catch(() => null) as { query?: string } | null;
    const query = (body?.query ?? "").trim();

    if (!query) {
        return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
        where: {
            NOT: [
                { email: ADMIN_EMAIL },
                { role: "BOOTH" },
            ],
            OR: [
                { name: { contains: query } },
                { email: { contains: query } },
            ],
        },
        orderBy: [
            { grade: "asc" },
            { classRoom: "asc" },
            { name: "asc" },
        ],
        select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            classRoom: true,
            balance: true,
            role: true,
        },
        take: 50,
    });

    return NextResponse.json({ users });
}
