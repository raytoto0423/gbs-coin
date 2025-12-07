// app/admin/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import AdminDashboard from "./AdminDashboard";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export default async function AdminPage() {
    const session = await auth();

    // 🔐 관리자 이메일이 아니면 접근 차단
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center space-y-3 p-6 border rounded-lg bg-white shadow-sm">
                    <h1 className="text-xl font-bold text-gray-900">
                        관리자만 접근할 수 있습니다.
                    </h1>
                    <p className="text-sm text-gray-700">
                        관리자 계정을 사용해 로그인했는지 확인해 주세요.
                    </p>

                    {/* 🔴 차단 화면에도 로그아웃 버튼 추가 */}
                    <div className="mt-3 flex justify-center">
                        <LogoutButton />
                    </div>
                </div>
            </main>
        );
    }

    // 🔍 DB 조회
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

                {/* 상단 헤더 */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            관리자 대시보드
                        </h1>
                        <p className="text-sm text-gray-700">
                            {session.user.email} 계정으로 접속 중
                        </p>
                    </div>

                    {/* 로그아웃 버튼 */}
                    <LogoutButton />
                </div>

                {/* 관리자 실제 기능 컴포넌트 */}
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
