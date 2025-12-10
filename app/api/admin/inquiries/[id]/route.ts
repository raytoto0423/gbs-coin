// app/api/admin/inquiries/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

/** URL or params 에서 id를 안전하게 뽑아오는 헬퍼 */
function extractInquiryId(req: NextRequest, params?: { id?: string }) {
    if (params?.id) return params.id;

    // /api/admin/inquiries/abc123 형태에서 마지막 조각을 ID로 사용
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    return last || null;
}

/**
 * 문의에 대한 관리자 답변 저장
 * POST /api/admin/inquiries/[id]
 */
export async function POST(
    req: NextRequest,
    context: { params: { id?: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.email !== ADMIN_EMAIL) {
            return NextResponse.json(
                { error: "관리자만 답변을 작성할 수 있습니다." },
                { status: 401 }
            );
        }

        const inquiryId = extractInquiryId(req, context.params);
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
    req: NextRequest,
    context: { params: { id?: string } }
) {
    try {
        const session = await auth();
        if (!session?.user || session.user.email !== ADMIN_EMAIL) {
            return NextResponse.json(
                { error: "관리자만 삭제할 수 있습니다." },
                { status: 401 }
            );
        }

        const inquiryId = extractInquiryId(req, context.params);
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
