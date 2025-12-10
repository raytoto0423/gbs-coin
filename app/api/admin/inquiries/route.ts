// app/api/admin/inquiries/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.email !== ADMIN_EMAIL) {
            return NextResponse.json(
                { error: "관리자만 조회할 수 있습니다." },
                { status: 401 }
            );
        }

        const inquiries = await prisma.inquiry.findMany({
            where: {
                archivedByAdmin: false, // ✅ 관리자에게 숨긴 건 안 가져옴
            },
            orderBy: { createdAt: "desc" },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        grade: true,
                        classRoom: true,
                    },
                },
            },
            take: 100,
        });

        return NextResponse.json({ inquiries });
    } catch (err) {
        console.error("GET /api/admin/inquiries error", err);
        return NextResponse.json(
            { error: "문의 목록 조회 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
