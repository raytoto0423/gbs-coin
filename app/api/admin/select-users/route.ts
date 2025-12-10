// app/api/admin/select-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

type Scope = "ALL" | "GRADE" | "GRADE_CLASS";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json({ error: "관리자만 사용할 수 있습니다." }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as
        | { scope?: Scope; grade?: number; classRoom?: number }
        | null;

    if (!body?.scope) {
        return NextResponse.json({ error: "scope가 필요합니다." }, { status: 400 });
    }

    const { scope, grade, classRoom } = body;

    const whereBase: any = {
        // 관리자 / 부스 계정 제외
        NOT: [
            { email: ADMIN_EMAIL },
            { role: "BOOTH" },
            { email: { endsWith: "@booth.local" } },
        ],
    };

    if (scope === "GRADE") {
        if (typeof grade !== "number") {
            return NextResponse.json({ error: "grade가 필요합니다." }, { status: 400 });
        }
        whereBase.grade = grade;
    } else if (scope === "GRADE_CLASS") {
        if (typeof grade !== "number" || typeof classRoom !== "number") {
            return NextResponse.json(
                { error: "grade와 classRoom이 필요합니다." },
                { status: 400 }
            );
        }
        whereBase.grade = grade;
        whereBase.classRoom = classRoom;
    } else if (scope !== "ALL") {
        return NextResponse.json({ error: "잘못된 scope 입니다." }, { status: 400 });
    }

    const users = await prisma.user.findMany({
        where: whereBase,
        orderBy: [
            { grade: "asc" },
            { classRoom: "asc" },
            { name: "asc" },
        ],
        select: {
            id: true,
            name: true,
            email: true,
            grade: true,
            classRoom: true,
            balance: true,
            role: true,
        },
    });

    return NextResponse.json({ ok: true, users });
}
