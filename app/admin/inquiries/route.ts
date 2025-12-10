// app/api/admin/inquiries/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export async function GET() {
    const session = await auth();

    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { message: "관리자만 접근할 수 있습니다." },
            { status: 403 }
        );
    }

    const inquiries = await prisma.inquiry.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            message: true,
            createdAt: true,
            sender: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    grade: true,
                    classRoom: true,
                    number: true,
                },
            },
        },
    });

    return NextResponse.json({
        ok: true,
        inquiries,
    });
}
