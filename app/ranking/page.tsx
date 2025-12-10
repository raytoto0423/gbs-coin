// app/ranking/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function RankingPage() {
    const session = await auth();

    if (!session?.user) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <p className="text-gray-900">로그인 후 이용할 수 있습니다.</p>
            </main>
        );
    }

    const booths = await prisma.booth.findMany({
        orderBy: { balance: "desc" },
    });

    const role = (session.user as any).role ?? "USER";

    const backHref =
        role === "ADMIN" ? "/admin" : role === "BOOTH" ? "/booths" : "/user";
    const backLabel =
        role === "ADMIN"
            ? "관리자 페이지로"
            : role === "BOOTH"
                ? "부스 페이지로"
                : "내 정보로";

    const currentBoothId =
        role === "BOOTH"
            ? ((session.user as any).boothId ?? session.user.id)
            : null;

    return (
        <main className="min-h-screen max-w-3xl mx-auto px-4 py-8 space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-50">
                        반 부스 코인 순위
                    </h1>
                    <p className="text-sm text-gray-700">
                        현재 기준 각 반 부스의 보유 코인 순위입니다.
                    </p>
                </div>
                <Link
                    href={backHref}
                    className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-900 hover:bg-gray-100"
                >
                    {backLabel}
                </Link>
            </div>

            {/* 순위 테이블 */}
            <section className="border rounded-lg shadow-sm bg-white overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-gray-900">순위</th>
                        <th className="px-4 py-2 text-left text-gray-900">부스 ID</th>
                        <th className="px-4 py-2 text-left text-gray-900">반 이름</th>
                        <th className="px-4 py-2 text-right text-gray-900">
                            보유 코인
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {booths.length === 0 ? (
                        <tr>
                            <td
                                colSpan={4}
                                className="px-4 py-6 text-center text-gray-600"
                            >
                                등록된 부스가 없습니다.
                            </td>
                        </tr>
                    ) : (
                        booths.map((b, idx) => {
                            const isMyBooth =
                                currentBoothId && b.id === currentBoothId;

                            const baseColor =
                                idx === 0
                                    ? "bg-yellow-50"
                                    : idx === 1
                                        ? "bg-gray-50"
                                        : idx === 2
                                            ? "bg-orange-50"
                                            : "";

                            const rowClass = isMyBooth
                                ? "bg-blue-50"
                                : baseColor;

                            return (
                                <tr key={b.id} className={rowClass}>
                                    <td className="px-4 py-2 text-gray-900">{idx + 1}</td>
                                    <td className="px-4 py-2 font-mono text-gray-900">
                                        {b.id}
                                    </td>
                                    <td className="px-4 py-2 text-gray-900">{b.name}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-900">
                                        {b.balance.toLocaleString()} C
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </section>
        </main>
    );
}
