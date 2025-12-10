import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message || message.trim() === "") {
        return NextResponse.json({ error: "내용이 비어있음" }, { status: 400 });
    }

    await prisma.inquiry.create({
        data: {
            senderId: session.user.id,
            message,
        },
    });

    return NextResponse.json({ ok: true });
}
