// app/api/admin/inquiries/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

/**
 * 문의에 대한 관리자 답변 저장
 * POST /api/admin/inquiries/[id]
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.email !== ADMIN_EMAIL) {
            return NextResponse.json(
                { error: "관리자만 답변을 작성할 수 있습니다." },
                { status: 401 }
            );
        }

        const inquiryId = params.id;
        if (!inquiryId) {
            return NextResponse.json(
                { error: "문의 ID가 필요합니다." },
                { status: 400 }
            );
        }

        const body = await req.json().catch(() => null);
        const replyMessage = body?.replyMessage?.trim();

        if (!replyMessage) {
            return NextResponse.json(
                { error: "답변 내용을 입력해주세요." },
                { status: 400 }
            );
        }

        const updated = await prisma.inquiry.update({
            where: { id: inquiryId },
            data: {
                replyMessage,
                repliedAt: new Date(),
                repliedByEmail: session.user.email ?? null,
            },
        });

        return NextResponse.json({ ok: true, inquiry: updated });
    } catch (err) {
        console.error("POST /api/admin/inquiries/[id] error", err);
        return NextResponse.json(
            { error: "답변 저장 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}

/**
 * 문의 삭제
 * DELETE /api/admin/inquiries/[id]
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.email !== ADMIN_EMAIL) {
            return NextResponse.json(
                { error: "관리자만 삭제할 수 있습니다." },
                { status: 401 }
            );
        }

        const inquiryId = params.id;
        if (!inquiryId) {
            return NextResponse.json(
                { error: "문의 ID가 필요합니다." },
                { status: 400 }
            );
        }

        await prisma.inquiry.delete({
            where: { id: inquiryId },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("DELETE /api/admin/inquiries/[id] error", err);
        return NextResponse.json(
            { error: "삭제 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
