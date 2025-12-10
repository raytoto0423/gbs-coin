// app/api/admin/inquiries/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

// URL/params 에서 id 뽑기
function extractInquiryId(req: NextRequest, params?: { id?: string }) {
    if (params?.id) return params.id;
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    return last || null;
}

/** ✅ 문의 답변 저장 */
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

/** ✅ 관리자 목록에서만 숨기기 (soft delete) */
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

        // ❌ 실제 삭제 대신, 관리자 목록에서만 숨김
        await prisma.inquiry.update({
            where: { id: inquiryId },
            data: { archivedByAdmin: true },
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
