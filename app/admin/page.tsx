// app/admin/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import AdminDashboard from "./AdminDashboard";
import Link from "next/link";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export default async function AdminPage() {
    const session = await auth();

    // 🔐 관리자 이메일이 아니면 바로 차단
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center space-y-2">
                    <h1 className="text-xl font-bold text-gray-900">
                        관리자만 접근할 수 있습니다.
                    </h1>
                    <p className="text-sm text-gray-600">
                        관리자 계정을 사용해 로그인했는지 확인해 주세요.
                    </p>
                </div>
            </main>
        );
    }

    const [users, booths, txRaw] = await Promise.all([
        prisma.user.findMany({
            where: {
                NOT: { email: ADMIN_EMAIL }, // 🔥 관리자 계정은 목록에서 제외
            },
            orderBy: { createdAt: "asc" },
        }),
        prisma.booth.findMany({
            orderBy: { id: "asc" },
        }),
        prisma.transaction.findMany({
            orderBy: { createdAt: "desc" },
            take: 50, // 최근 50개만
            include: {
                fromUser: true,
                toUser: true,
                fromBooth: true,
                toBooth: true,
            },
        }),
    ]);

    const transactions = txRaw.map((t) => ({
        id: t.id,
        title: t.title ?? "",
        amount: t.amount,
        createdAt: t.createdAt.toISOString(),
        fromUserName: t.fromUser?.name ?? null,
        fromUserEmail: t.fromUser?.email ?? null,
        toUserName: t.toUser?.name ?? null,
        toUserEmail: t.toUser?.email ?? null,
        fromBoothId: t.fromBoothId,
        fromBoothName: t.fromBooth?.name ?? null,
        toBoothId: t.toBoothId,
        toBoothName: t.toBooth?.name ?? null,
    }));

    return (
        <main className="min-h-screen flex justify-center px-4 py-8">
            <div className="w-full max-w-5xl space-y-6">
                {/* 상단 헤더 + 로그아웃 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-50">
                            관리자 대시보드
                        </h1>
                        <p className="text-sm text-gray-700">
                            {session.user.email} 계정으로 접속 중
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/ranking"
                            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-900 hover:bg-gray-100"
                        >
                            반 부스 코인 순위
                        </Link>
                        <LogoutButton />
                    </div>
                </div>

                <AdminDashboard
                    users={users.map((u) => ({
                        id: u.id,
                        name: u.name ?? "",
                        email: u.email,
                        role: u.role,
                        balance: u.balance,
                    }))}
                    booths={booths.map((b) => ({
                        id: b.id,
                        name: b.name,
                        balance: b.balance,
                    }))}
                    transactions={transactions}
                />
            </div>
        </main>
    );
}
