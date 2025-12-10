// app/api/booth/set-password/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json(
            { message: "로그인이 필요합니다." },
            { status: 401 }
        );
    }

    const me = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!me) {
        return NextResponse.json(
            { message: "사용자를 찾을 수 없습니다." },
            { status: 404 }
        );
    }

    // ✅ 회장만 허용
    if (me.classRole !== "회장") {
        return NextResponse.json(
            { message: "학급 회장만 부스 비밀번호를 설정할 수 있습니다." },
            { status: 403 }
        );
    }

    if (me.grade == null || me.classRoom == null) {
        return NextResponse.json(
            { message: "사용자의 학년/반 정보가 없습니다." },
            { status: 400 }
        );
    }

    const body = await req.json().catch(() => null);
    const newPassword = (body?.password ?? "").trim();

    if (!newPassword || newPassword.length < 4) {
        return NextResponse.json(
            { message: "비밀번호는 최소 4자 이상이어야 합니다." },
            { status: 400 }
        );
    }

    const booth = await prisma.booth.findFirst({
        where: {
            grade: me.grade,
            classRoom: me.classRoom,
        },
    });

    if (!booth) {
        return NextResponse.json(
            { message: "해당 반의 부스를 찾을 수 없습니다." },
            { status: 404 }
        );
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await prisma.booth.update({
        where: { id: booth.id },
        data: {
            passwordHash: hash,
            passwordPlain: newPassword, // 🔥 관리자 페이지에서 보여줄 값
        },
    });

    return NextResponse.json({
        ok: true,
        message: "부스 비밀번호가 변경되었습니다.",
    });
}
