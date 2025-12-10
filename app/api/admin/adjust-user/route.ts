// app/api/admin/adjust-user/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // 빌드 타임 프리렌더/모듈 실행 방지

export async function POST(req: NextRequest) {
    // ⚠️ Prisma / Auth 는 핸들러 안에서만 동적 import
    const [{ auth }, { prisma }] = await Promise.all([
        import("@/auth"),
        import("@/lib/prisma"),
    ]);

    const session = await auth();

    // 관리자만 접근 가능
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json(
            { message: "관리자 권한이 필요합니다." },
            { status: 403 }
        );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json(
            { message: "잘못된 요청입니다." },
            { status: 400 }
        );
    }

    const { userId, amount, type } = body as {
        userId?: string;
        amount?: number;
        type?: "INCREASE" | "DECREASE";
    };

    if (!userId || typeof amount !== "number") {
        return NextResponse.json(
            { message: "userId와 amount가 필요합니다." },
            { status: 400 }
        );
    }

    if (type !== "INCREASE" && type !== "DECREASE") {
        return NextResponse.json(
            { message: "type은 INCREASE 또는 DECREASE 여야 합니다." },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        return NextResponse.json(
            { message: "해당 사용자를 찾을 수 없습니다." },
            { status: 404 }
        );
    }

    const newBalance =
        type === "INCREASE" ? user.balance + amount : user.balance - amount;

    if (newBalance < 0) {
        return NextResponse.json(
            { message: "잔액이 음수가 될 수 없습니다." },
            { status: 400 }
        );
    }

    try {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { balance: newBalance },
        });

        return NextResponse.json({
            ok: true,
            message: "사용자 잔액이 수정되었습니다.",
            user: updated,
        });
    } catch (error) {
        console.error("adjust-user error", error);
        return NextResponse.json(
            { message: "사용자 잔액 수정 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
