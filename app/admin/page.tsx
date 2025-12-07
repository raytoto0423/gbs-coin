// app/admin/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
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
            <div className="w-full max-w-4xl">
                <h1 className="text-2xl font-bold mb-4">관리자 대시보드</h1>
                <p className="text-sm text-gray-600 mb-6">
                    학생/선생님의 코인 잔액과 부스 잔액을 조정할 수 있습니다.
                </p>

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
