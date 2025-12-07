// app/api/booth/activities/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user || session.user.role !== "BOOTH") {
        return NextResponse.json({ message: "권한 없음" }, { status: 401 });
    }

    const boothId = session.user.boothId ?? session.user.id;

    const activities = await prisma.activity.findMany({
        where: { boothId },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ activities });
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user || session.user.role !== "BOOTH") {
        return NextResponse.json({ message: "권한 없음" }, { status: 401 });
    }

    const boothId = session.user.boothId ?? session.user.id;

    const body = await request.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ message: "잘못된 요청" }, { status: 400 });
    }

    const { title, price, type } = body as {
        title?: string;
        price?: number;
        type?: string;
    };

    if (!title || typeof price !== "number" || price < 0) {
        return NextResponse.json({ message: "제목과 가격을 확인하세요." }, { status: 400 });
    }

    if (type !== "PAY" && type !== "REWARD") {
        return NextResponse.json({ message: "잘못된 타입입니다." }, { status: 400 });
    }

    const activity = await prisma.activity.create({
        data: {
            title,
            price,
            type,
            boothId,
        },
    });

    return NextResponse.json({ activity }, { status: 201 });
}

export async function DELETE(request: Request) {
    const session = await auth();
    if (!session?.user || session.user.role !== "BOOTH") {
        return NextResponse.json({ message: "권한 없음" }, { status: 401 });
    }

    const boothId = session.user.boothId ?? session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ message: "id가 필요합니다." }, { status: 400 });
    }

    // 이 부스의 활동만 삭제 가능하게
    const existing = await prisma.activity.findFirst({
        where: { id, boothId },
    });

    if (!existing) {
        return NextResponse.json({ message: "해당 활동이 없거나 권한이 없습니다." }, { status: 404 });
    }

    await prisma.activity.delete({ where: { id } });

    return NextResponse.json({ ok: true });
}
