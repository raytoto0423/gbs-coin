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

    const { user } = session;

    // 학생 회장만 허용 (필요하면 TEACHER도 허용 가능)
    if (user.role !== "STUDENT") {
        return NextResponse.json(
            { message: "학생 계정만 사용할 수 있습니다." },
            { status: 403 }
        );
    }

    if (user.classRole !== "회장") {
        return NextResponse.json(
            { message: "학급 회장만 부스 비밀번호를 변경할 수 있습니다." },
            { status: 403 }
        );
    }

    const grade = user.grade;
    const classRoom = user.classRoom;

    if (!grade || !classRoom) {
        return NextResponse.json(
            { message: "학급 정보가 없습니다." },
            { status: 400 }
        );
    }

    const body = await req.json().catch(() => null);
    const newPassword = body?.newPassword?.toString().trim() ?? "";

    if (!newPassword) {
        return NextResponse.json(
            { message: "새 비밀번호를 입력해주세요." },
            { status: 400 }
        );
    }

    if (newPassword.length < 4 || newPassword.length > 20) {
        return NextResponse.json(
            { message: "비밀번호는 4~20자 사이여야 합니다." },
            { status: 400 }
        );
    }

    const boothId = `${grade}-${classRoom}`;

    const booth = await prisma.booth.findUnique({
        where: { id: boothId },
    });

    if (!booth) {
        return NextResponse.json(
            { message: `${grade}학년 ${classRoom}반 부스를 찾을 수 없습니다.` },
            { status: 404 }
        );
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await prisma.booth.update({
        where: { id: boothId },
        data: {
            passwordHash: hash,
            passwordPlain: newPassword, // 관리자 페이지에서 확인용
        },
    });

    return NextResponse.json({
        ok: true,
        message: `${grade}학년 ${classRoom}반 부스 비밀번호가 변경되었습니다.`,
    });
}
