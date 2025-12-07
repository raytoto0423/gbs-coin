// app/admin/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export default async function AdminPage() {
    const session = await auth();

    // 🔐 관리자 이메일이 아니면 거부
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>관리자만 접근할 수 있습니다.</p>
            </main>
        );
    }

    const [users, booths] = await Promise.all([
        prisma.user.findMany({
            orderBy: { createdAt: "asc" },
        }),
        prisma.booth.findMany({
            orderBy: { id: "asc" },
        }),
    ]);

    return (
        <main className="min-h-screen flex justify-center px-4 py-8">
            <div className="w-full max-w-4xl space-y-6">
                {/* 상단 헤더 + 로그아웃 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            관리자 대시보드
                        </h1>
                        <p className="text-sm text-gray-600">
                            {session.user.email} 계정으로 접속 중
                        </p>
                    </div>
                    <LogoutButton />
                </div>

                {/* 기존 AdminDashboard 사용 */}
                {/* AdminDashboard는 이전에 만든 그대로 두면 됨 */}
                {/* props 형태만 맞춰서 전달 */}
                {/* @ts-ignore 단순화용 */}
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
                />
            </div>
        </main>
    );
}
