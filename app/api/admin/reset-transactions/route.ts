// app/api/admin/reset-transactions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export async function POST() {
    const session = await auth();

    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json(
            { error: "관리자만 사용할 수 있습니다." },
            { status: 401 }
        );
    }

    await prisma.transaction.deleteMany({});

    return NextResponse.json({ ok: true });
}
