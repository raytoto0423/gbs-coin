// app/user/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

    // DB에서 유저 정보 + 최근 트랜잭션 10개 가져오기
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
                toBooth: true, // 🔥 여기! booth가 아니라 toBooth
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
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">{user.name}님 환영합니다.</h1>
                <p className="text-gray-500 text-sm">{user.email}</p>
            </div>

            {/* 잔액 카드 */}
            <section className="p-4 border rounded-lg shadow-sm bg-white space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">보유 코인</h2>
                        <p className="text-3xl font-bold text-blue-600">
                            {user.balance.toLocaleString()} C
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {/* 결제 버튼 */}
                        <Link
                            href="/user/scan"
                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                            QR 스캔하여 결제하기
                        </Link>

                        {/* 관리자 전용 버튼 */}
                        {user.role === "ADMIN" && (
                            <Link
                                href="/admin"
                                className="inline-block px-3 py-1 border rounded-md text-xs hover:bg-gray-100"
                            >
                                관리자 페이지로 이동
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* 최근 거래 내역 */}
            <section>
                <h2 className="text-lg font-semibold mb-3">최근 거래 내역</h2>

                {transactions.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                        최근 거래 내역이 없습니다.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((t) => {
                            const isIncoming = t.toUserId === userId; // 내가 받은 돈?
                            const amountSigned = isIncoming ? t.amount : -t.amount;
                            const amountText =
                                (amountSigned > 0 ? "+" : "") + amountSigned + " C";

                            const color =
                                amountSigned > 0 ? "text-green-600" : "text-red-600";

                            return (
                                <div
                                    key={t.id}
                                    className="p-3 border rounded-md bg-white shadow-sm"
                                >
                                    <p className="text-sm font-medium">
                                        {t.title ?? "거래"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(t.createdAt).toLocaleString("ko-KR", {
                                            timeZone: "Asia/Seoul",
                                        })}
                                    </p>

                                    <p className={`mt-1 text-lg font-bold ${color}`}>
                                        {amountText}
                                    </p>

                                    {/* 상대 정보 표시 (부스가 있으면 부스, 아니면 상대 유저) */}
                                    {t.toBooth && (
                                        <p className="text-xs text-gray-600">
                                            부스: {t.toBooth.name}
                                        </p>
                                    )}
                                    {!t.toBooth && isIncoming && t.fromUser && (
                                        <p className="text-xs text-gray-600">
                                            보낸 사람: {t.fromUser.name ?? t.fromUser.email}
                                        </p>
                                    )}
                                    {!t.toBooth && !isIncoming && t.toUser && (
                                        <p className="text-xs text-gray-600">
                                            받은 사람: {t.toUser.name ?? t.toUser.email}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
