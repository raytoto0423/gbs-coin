// app/api/user/inquiry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// 문의 보내기 (학생/선생님만)
export async function POST(req: NextRequest) {
    const session = await auth();

    // 로그인 안 돼 있으면 로그인 페이지로
    if (!session?.user) {
        return NextResponse.redirect(new URL("/login/user", req.url));
    }

    const userId = session.user.id;

    let message: string | undefined;

    // 폼 제출 / fetch 둘 다 지원
    const contentType = req.headers.get("content-type") ?? "";
    try {
        if (contentType.includes("application/json")) {
            const body = await req.json().catch(() => null);
            if (body?.message) {
                message = String(body.message).trim();
            }
        } else {
            const formData = await req.formData().catch(() => null);
            if (formData) {
                const m = formData.get("message");
                if (m) message = String(m).trim();
            }
        }
    } catch {
        // 그냥 무시하고 아래에서 에러 처리
    }

    if (!message) {
        // 내용이 없으면 에러 표시하고 문의 페이지로
        const url = new URL("/user/inquiry?error=1", req.url);
        return NextResponse.redirect(url);
    }

    // DB에 저장
    await prisma.inquiry.create({
        data: {
            senderId: userId,
            message,
        },
    });

    // ✅ 문의 페이지로 돌아가면서 "sent=1" 쿼리 붙여서 성공 메시지 표시
    const redirectUrl = new URL("/user/inquiry?sent=1", req.url);
    return NextResponse.redirect(redirectUrl);
}
