// app/api/inquiry/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json(
            { error: "로그인이 필요합니다." },
            { status: 401 }
        );
    }

    const body = await req.json().catch(() => null);
    const message = (body?.message as string | undefined)?.trim();

    if (!message) {
        return NextResponse.json(
            { error: "문의 내용을 입력해 주세요." },
            { status: 400 }
        );
    }

    await prisma.inquiry.create({
        data: {
            senderId: session.user.id,
            message,
        },
    });

    return NextResponse.json({ ok: true });
}
