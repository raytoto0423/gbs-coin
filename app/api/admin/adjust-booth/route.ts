// app/api/admin/adjust-booth/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // 빌드 시 프리렌더/모듈 실행 방지

export async function POST(req: NextRequest) {
    // Prisma / Auth 는 빌드 시 실행되면 안 되므로 핸들러 안에서 import
    const [{ auth }, { prisma }] = await Promise.all([
        import("@/auth"),
        import("@/lib/prisma"),
    ]);

    const session = await auth();

    // 🔐 관리자 권한 체크
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    // body 파싱
    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
    }

    const { boothId, amount, type } = body;
    // type: "INCREASE" | "DECREASE"
    // amount: number

    if (!boothId || typeof amount !== "number") {
        return NextResponse.json(
            { message: "boothId와 amount가 필요합니다." },
            { status: 400 }
        );
    }

    // 부스 존재 확인
    const booth = await prisma.booth.findUnique({ where: { id: boothId } });
    if (!booth) {
        return NextResponse.json({ message: "부스를 찾을 수 없습니다." }, { status: 404 });
    }

    // 처리
    try {
        const updated = await prisma.booth.update({
            where: { id: boothId },
            data:
                type === "DECREASE"
                    ? { balance: booth.balance - amount }
                    : { balance: booth.balance + amount },
        });

        return NextResponse.json({
            ok: true,
            message: "부스 잔액이 수정되었습니다.",
            booth: updated,
        });
    } catch (error) {
        console.error("adjust-booth error", error);
        return NextResponse.json(
            { message: "부스 잔액 수정 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
