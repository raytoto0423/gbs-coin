// app/api/admin/inquiries/[id]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

// ✅ 문의 삭제: DELETE /api/admin/inquiries/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();

    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { error: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    const id = params.id;

    try {
        await prisma.inquiry.delete({
            where: { id },
        });

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("DELETE /api/admin/inquiries/[id] error", e);
        return NextResponse.json(
            { error: "삭제 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

// ✅ 문의 답변: POST /api/admin/inquiries/[id]
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();

    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { error: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    const id = params.id;
    const body = await req.json().catch(() => null);
    const replyMessage = (body?.replyMessage as string | undefined)?.trim();

    if (!replyMessage) {
        return NextResponse.json(
            { error: "답변 내용을 입력해 주세요." },
            { status: 400 }
        );
    }

    try {
        const updated = await prisma.inquiry.update({
            where: { id },
            data: {
                replyMessage,
                repliedAt: new Date(),
                repliedByEmail: session.user.email ?? null,
            },
        });

        return NextResponse.json({ ok: true, inquiryId: updated.id });
    } catch (e) {
        console.error("POST /api/admin/inquiries/[id] error", e);
        return NextResponse.json(
            { error: "답변 저장 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
