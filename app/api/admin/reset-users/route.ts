// app/api/admin/reset-users/route.ts
import { NextRequest, NextResponse } from 'next/server';

// 빌드/프리렌더링 때 이 라우트는 건드리지 말라는 힌트 (안 넣어도 큰 상관 X)
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    // 🔒 운영(prod)에서는 이 API 자체를 막기
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Not allowed in production', { status: 403 });
    }

    // ⬇️ 여기서만 Prisma를 동적으로 import → 모듈 로드 시점에는 절대 DB 안 건드림
    const { prisma } = await import('@/lib/prisma');

    try {
        // 👉 아래는 네 프로젝트 로직에 맞게 수정해
        // 예시: 모든 트랜잭션 삭제 + 유저 잔고 0 초기화

        await prisma.transaction.deleteMany();
        await prisma.user.updateMany({
            data: { balance: 0 },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('reset-users error', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
