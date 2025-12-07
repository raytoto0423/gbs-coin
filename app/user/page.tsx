// app/user/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton"; // 🔥 추가

export default async function UserPage() {
    const session = await auth();

    if (!session?.user) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>로그인 후 이용할 수 있습니다.</p>
            </main>
        );
    }

    const userId = session.user.id;

    const [user, transactions] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                balance: true,
                role: true,
                email: true,
            },
        }),
        prisma.transaction.findMany({
            where: {
                OR: [{ fromUserId: userId }, { toUserId: userId }],
            },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
                fromUser: true,
                toUser: true,
                toBooth: true,
            },
        }),
    ]);

    if (!user) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>유저 정보를 찾을 수 없습니다.</p>
            </main>
        );
    }

    return (
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
            {/* 헤더 */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {user.name}님 환영합니다.
                    </h1>
                    <p className="text-gray-600 text-sm">{user.email}</p>
                </div>

                {/* 🔴 상단 오른쪽에 로그아웃 버튼 */}
                <LogoutButton />
            </div>

            {/* 잔액 카드 */}
            <section className="p-4 border rounded-lg shadow-sm bg-white space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            보유 코인
                        </h2>
                        <p className="text-3xl font-bold text-blue-600">
                            {user.balance.toLocaleString()} C
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <Link
                            href="/user/scan"
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                            QR 스캔하여 결제하기
                        </Link>

                        {user.role === "ADMIN" && (
                            <Link
                                href="/admin"
                                className="inline-block px-3 py-1 border rounded-md text-xs hover:bg-gray-100"
                            >
                                관리자 페이지
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* 아래 거래 내역 부분은 그대로 두면 됨 */}
            {/* ... */}
        </main>
    );
}
