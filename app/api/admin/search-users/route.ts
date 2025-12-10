// app/api/admin/search-users/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export async function GET(req: Request) {
    const session = await auth();

    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { message: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    if (!q) {
        return NextResponse.json(
            { message: "검색어(q)가 필요합니다." },
            { status: 400 }
        );
    }

    const users = await prisma.user.findMany({
        where: {
            AND: [
                { email: { not: ADMIN_EMAIL } },
                { role: { not: "BOOTH" } },
            ],
        },
        orderBy: [
            { grade: "asc" },
            { classRoom: "asc" },
            { name: "asc" },
        ],
        take: 50, // 너무 많이 나오지 않게 제한
        select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            classRoom: true,
            classRole: true,
            role: true,
            balance: true,
        },
    });

    return NextResponse.json({
        ok: true,
        users,
    });
}
