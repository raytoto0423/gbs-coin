// app/api/admin/reset-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🔴 절대로 파일 최상단에서 prisma 호출하지 말 것
// 🔴 resetUsers() 같은 거 여기서 바로 실행하지 말 것

export async function POST(req: NextRequest) {
    // 운영 환경에서는 아예 막기
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Not allowed in production', { status: 403 });
    }

    try {
        // 여기는 네 프로젝트 로직에 맞게 수정
        // 예시: 유저들 잔액 0으로 초기화 + 트랜잭션 삭제
        await prisma.transaction.deleteMany();
        await prisma.user.updateMany({
            data: { balance: 0 },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('reset-users error', err);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
