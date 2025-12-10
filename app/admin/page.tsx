// app/admin/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import AdminActions from "./AdminActions";

const ADMIN_EMAIL = "dhhwang423@gmail.com";

export default async function AdminPage() {
    const session = await auth();

    // 🔐 관리자만 접근 가능
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <p className="text-gray-900">관리자만 접근할 수 있습니다.</p>
            </main>
        );
    }

    // 통계 + 부스 리스트 가져오기
    const [userCount, boothCount, txCount, booths] = await Promise.all([
        prisma.user.count(),
        prisma.booth.count(),
        prisma.transaction.count(),
        prisma.booth.findMany({
            orderBy: [
                { grade: "asc" },
                { classRoom: "asc" },
                { id: "asc" },
            ],
            select: {
                id: true,
                name: true,
                grade: true,
                classRoom: true,
                balance: true,
                passwordPlain: true,
            },
        }),
    ]);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-5xl px-4 py-6 space-y-8">
                {/* 상단 헤더 */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">관리자 페이지</h1>
                        <p className="text-xs text-slate-400 mt-1">
                            {session.user.email} 로 로그인 중
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/user"
                            className="rounded-md border border-slate-600 px-3 py-1.5 text-xs hover:bg-slate-800"
                        >
                            사용자 화면으로
                        </Link>
                        <LogoutButton />
                    </div>
                </header>

                {/* 간단 통계 카드 */}
                <section className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
                        <p className="text-xs text-slate-400">등록된 유저 수</p>
                        <p className="mt-1 text-2xl font-bold">{userCount}</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
                        <p className="text-xs text-slate-400">등록된 부스 수</p>
                        <p className="mt-1 text-2xl font-bold">{boothCount}</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
                        <p className="text-xs text-slate-400">전체 거래 수</p>
                        <p className="mt-1 text-2xl font-bold">{txCount}</p>
                    </div>
                </section>

                {/* 관리자 액션 (잔액 초기화 + 부스 잔액 조정) */}
                <AdminActions />

                {/* 부스 목록 + 비밀번호 표시 */}
                <section className="mt-8">
                    <h2 className="text-lg font-semibold mb-3">부스 목록 및 비밀번호</h2>
                    <p className="text-xs text-slate-400 mb-2">
                        비밀번호는 <span className="font-mono">passwordPlain</span> 컬럼에 표시됩니다.
                        (초기값 1234, 회장이 변경하면 여기 값도 같이 바뀝니다.)
                    </p>

                    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/60">
                        <table className="min-w-full text-xs">
                            <thead>
                            <tr className="bg-slate-800/80">
                                <th className="px-3 py-2 text-left">부스 ID</th>
                                <th className="px-3 py-2 text-left">이름</th>
                                <th className="px-3 py-2 text-center">학년</th>
                                <th className="px-3 py-2 text-center">반</th>
                                <th className="px-3 py-2 text-right">잔액 (C)</th>
                                <th className="px-3 py-2 text-left">비밀번호</th>
                            </tr>
                            </thead>
                            <tbody>
                            {booths.map((b) => (
                                <tr key={b.id} className="border-t border-slate-800">
                                    <td className="px-3 py-1.5 font-mono">{b.id}</td>
                                    <td className="px-3 py-1.5">{b.name}</td>
                                    <td className="px-3 py-1.5 text-center">
                                        {b.grade ?? "-"}
                                    </td>
                                    <td className="px-3 py-1.5 text-center">
                                        {b.classRoom ?? "-"}
                                    </td>
                                    <td className="px-3 py-1.5 text-right">
                                        {b.balance.toLocaleString()}
                                    </td>
                                    <td className="px-3 py-1.5 font-mono">
                                        {b.passwordPlain ?? "(미설정)"}
                                    </td>
                                </tr>
                            ))}
                            {booths.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-3 py-4 text-center text-slate-500"
                                    >
                                        등록된 부스가 없습니다. /api/dev/seed-booths 실행 후 다시
                                        확인해 주세요.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
