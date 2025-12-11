// app/admin/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import AdminActions from "./AdminActions";
import AdminUserActions from "./AdminUserActions";
import AdminInquiries from "./AdminInquiries";
import BoothTable from "./BoothTable";


const ADMIN_EMAIL = "dhhwang423@gmail.com";

function formatPartyUser(u: any | null) {
    if (!u) return null;
    const base = u.name ?? "(이름 없음)";
    const klass =
        u.grade && u.classRoom ? ` (${u.grade}-${u.classRoom})` : "";
    return `${base}${klass}`;
}

function formatPartyBooth(b: any | null) {
    if (!b) return null;
    return `부스 ${b.id} (${b.name})`;
}

export default async function AdminPage() {
    const session = await auth();

    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <p className="text-gray-900">관리자만 접근할 수 있습니다.</p>
            </main>
        );
    }

    const [users, userCount, boothCount, txCount, booths, transactions] =
        await Promise.all([
            // ✅ 유저 전체 목록 (관리자 + 부스 계정 제외)
            prisma.user.findMany({
                where: {
                    AND: [
                        { email: { not: ADMIN_EMAIL } },
                        { email: { not: { endsWith: "@booth.local" } } },
                    ],
                },
                orderBy: [
                    { grade: "asc" },
                    { classRoom: "asc" },
                    { name: "asc" },
                ],
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    grade: true,
                    classRoom: true,
                    classRole: true,
                    balance: true,
                },
            }),
            // ✅ 등록된 유저 수 (관리자 + 부스 계정 제외)
            prisma.user.count({
                where: {
                    AND: [
                        { email: { not: ADMIN_EMAIL } },
                        { email: { not: { endsWith: "@booth.local" } } },
                    ],
                },
            }),
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
                    activities: {
                        select: {
                            id: true,
                            title: true,
                            price: true,
                            type: true,
                            isActive: true,
                        },
                    },
                },
            }),

            prisma.transaction.findMany({
                orderBy: { createdAt: "desc" },
                take: 200, // 최신 200건만
                select: {
                    id: true,
                    title: true,
                    amount: true,
                    createdAt: true,
                    fromUser: {
                        select: {
                            name: true,
                            grade: true,
                            classRoom: true,
                        },
                    },
                    toUser: {
                        select: {
                            name: true,
                            grade: true,
                            classRoom: true,
                        },
                    },
                    fromBooth: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    toBooth: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
        ]);

    const formatter = new Intl.DateTimeFormat("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-6 space-y-10">
                {/* 헤더 */}
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
                    <Link
                        href="/ranking"
                        className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-xs"
                    >
                        부스 순위 확인하기
                    </Link>
                </header>

                {/* 통계 카드 */}
                <section className="grid gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
                        <p className="text-xs text-slate-400">등록된 유저 수</p>
                        <p className="mt-1 text-2xl font-bold">{userCount}</p>
                        <p className="mt-1 text-[10px] text-slate-500">
                            (관리자 계정과 @booth.local 계정은 제외)
                        </p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
                        <p className="text-xs text-slate-400">등록된 부스 수</p>
                        <p className="mt-1 text-2xl font-bold">{boothCount}</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
                        <p className="text-xs text-slate-400">전체 거래 수</p>
                        <p className="mt-1 text-2xl font-bold">{txCount}</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4">
                        <p className="text-xs text-slate-400">표시 중인 거래 수</p>
                        <p className="mt-1 text-2xl font-bold">{transactions.length}</p>
                    </div>
                </section>

                {/* 관리자 액션 (잔액 초기화 / 부스 잔액 조정 / 거래 초기화) */}
                <AdminActions />

                {/* 유저 잔액 관리 - 검색/선택/일괄 적용 */}
                <AdminUserActions />

                <AdminInquiries />

                {/* 🔥 유저 잔액 관리 (전체 목록, 보기용) */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">
                        유저 잔액 관리 (전체 목록)
                    </h2>
                    <p className="text-xs text-slate-400 mb-2">
                        관리자 계정과 부스 계정(@booth.local)은 목록에서 제외됩니다.
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/60 max-h-[420px]">
                        <table className="min-w-full text-xs">
                            <thead className="sticky top-0 z-10 bg-slate-800/90">
                            <tr>
                                <th className="px-3 py-2 text-left">이름</th>
                                <th className="px-3 py-2 text-left">이메일</th>
                                <th className="px-3 py-2 text-center">학년</th>
                                <th className="px-3 py-2 text-center">반</th>
                                <th className="px-3 py-2 text-center">역할</th>
                                <th className="px-3 py-2 text-right">잔액 (B)</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-t border-slate-800">
                                    <td className="px-3 py-1.5">
                                        {u.name}
                                        {u.classRole === "회장" && (
                                            <span className="ml-1 text-[10px] text-amber-300">
                          (회장)
                        </span>
                                        )}
                                        {u.classRole === "부회장" && (
                                            <span className="ml-1 text-[10px] text-sky-300">
                          (부회장)
                        </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-1.5">{u.email}</td>
                                    <td className="px-3 py-1.5 text-center">
                                        {u.grade ?? "-"}
                                    </td>
                                    <td className="px-3 py-1.5 text-center">
                                        {u.classRoom ?? "-"}
                                    </td>
                                    <td className="px-3 py-1.5 text-center">{u.role}</td>
                                    <td className="px-3 py-1.5 text-right">
                                        {u.balance.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-3 py-4 text-center text-slate-500"
                                    >
                                        표시할 유저가 없습니다.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 부스 목록 + 비밀번호 + 활동(상품) 접어서 보기 */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">
                        부스 목록 / 비밀번호 / 활동(상품)
                    </h2>
                    <p className="text-xs text-slate-400 mb-2">
                        각 부스 행의 왼쪽 화살표를 클릭하면, 해당 부스에 등록된 활동(상품) 목록이 아래로 펼쳐집니다.
                    </p>
                    <BoothTable booths={booths as any} />
                </section>


                {/* 전체 거래 내역 (최근 200건) */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">
                        전체 거래 내역 (최근 200건)
                    </h2>
                    <p className="text-xs text-slate-400 mb-2">
                        최신 거래부터 최대 200건까지만 표시됩니다. 상단의
                        &quot;전체 거래내역 삭제&quot; 버튼으로 모두 지울 수 있습니다.
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/60">
                        <table className="min-w-full text-xs">
                            <thead>
                            <tr className="bg-slate-800/80">
                                <th className="px-3 py-2 text-left">시간</th>
                                <th className="px-3 py-2 text-left">제목</th>
                                <th className="px-3 py-2 text-right">금액 (B)</th>
                                <th className="px-3 py-2 text-left">보낸 쪽</th>
                                <th className="px-3 py-2 text-left">받는 쪽</th>
                            </tr>
                            </thead>
                            <tbody>
                            {transactions.map((tx) => {
                                const senderUser = formatPartyUser(tx.fromUser as any);
                                const senderBooth = formatPartyBooth(tx.fromBooth as any);
                                const receiverUser = formatPartyUser(tx.toUser as any);
                                const receiverBooth = formatPartyBooth(tx.toBooth as any);

                                return (
                                    <tr
                                        key={tx.id}
                                        className="border-t border-slate-800"
                                    >
                                        <td className="px-3 py-1.5">
                                            {formatter.format(tx.createdAt)}
                                        </td>
                                        <td className="px-3 py-1.5">{tx.title}</td>
                                        <td className="px-3 py-1.5 text-right">
                                            {tx.amount.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-1.5">
                                            {senderUser ||
                                                senderBooth || (
                                                    <span className="text-slate-500">-</span>
                                                )}
                                        </td>
                                        <td className="px-3 py-1.5">
                                            {receiverUser ||
                                                receiverBooth || (
                                                    <span className="text-slate-500">-</span>
                                                )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {transactions.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-3 py-4 text-center text-slate-500"
                                    >
                                        거래 내역이 없습니다.
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
