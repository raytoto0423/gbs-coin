// app/user/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LogoutButton from "../../components/LogoutButton";

export default async function UserHomePage() {
    const session = await auth();

    if (!session?.user) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>로그인이 필요합니다. /login/user 에서 로그인해 주세요.</p>
            </main>
        );
    }

    // 부스 계정은 이 페이지 접근 불가
    if (session.user.role === "BOOTH") {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>부스 계정은 /booth 페이지를 이용해 주세요.</p>
            </main>
        );
    }

    const userId = session.user.id;

    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    const balance = dbUser?.balance ?? 0;

    // 최근 거래 내역 10개
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    const formatDate = (date: Date) =>
        date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

    return (
        <main className="min-h-screen flex justify-center px-4 py-8">
            <div className="w-full max-w-xl space-y-6">
                {/* 상단 헤더 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {session.user.name ?? "사용자"} 님
                        </h1>
                        <p className="text-sm text-gray-600">
                            역할: {session.user.role === "STUDENT" ? "학생" : session.user.role === "TEACHER" ? "선생님" : session.user.role}
                        </p>
                    </div>
                    <LogoutButton />
                </div>

                {/* 보유 코인 카드 */}
                <section className="p-4 rounded-xl border bg-blue-50">
                    <p className="text-sm text-gray-700 font-medium">현재 보유 코인</p>
                    <p className="mt-2 text-3xl font-extrabold text-blue-700">
                        {balance.toLocaleString()} C
                    </p>
                </section>

                {/* 결제(스캔) 버튼 */}
                <section className="space-y-2">
                    <p className="text-sm text-gray-700">
                        부스에서 보여주는 QR 코드를 찍어서 결제할 수 있습니다.
                    </p>
                    <Link
                        href="/user/scan"
                        className="block w-full text-center py-3 rounded-xl bg-green-600 text-white font-semibold text-lg hover:bg-green-700 transition-colors"
                    >
                        결제하기 (QR 스캔)
                    </Link>
                </section>

                {/* 최근 거래 내역 */}
                <section className="space-y-3">
                    <h2 className="text-lg font-bold">최근 거래 내역</h2>

                    {transactions.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            아직 거래 내역이 없습니다.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {transactions.map((t) => {
                                const isOutgoing = t.fromUserId === userId;
                                const signedAmount = isOutgoing ? -t.amount : t.amount;
                                const sign = signedAmount > 0 ? "+" : "";
                                const color =
                                    signedAmount > 0 ? "text-green-600" : "text-red-600";

                                return (
                                    <div
                                        key={t.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-white"
                                    >
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium">
                                                {t.title ?? "거래"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDate(t.createdAt)}
                                            </p>
                                        </div>
                                        <p className={`text-base font-bold ${color}`}>
                                            {sign}
                                            {Math.abs(signedAmount).toLocaleString()} C
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
