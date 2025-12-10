// app/booths/BoothDashboard.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

type ActivityType = "PAY" | "REWARD";

interface Activity {
    id: string;
    title: string;
    price: number;
    type: ActivityType;
}

interface BoothDashboardProps {
    boothId: string;
    boothBalance: number;
    rank: number | null;
}

export default function BoothDashboard({
                                           boothId,
                                           boothBalance,
                                           rank,
                                       }: BoothDashboardProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState<number | "">("");
    const [type, setType] = useState<ActivityType>("PAY");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchActivities = async () => {
        setError(null);
        const res = await fetch("/api/booth/activities");
        if (!res.ok) {
            setError("활동 목록을 불러오지 못했습니다.");
            return;
        }
        const data = await res.json();
        setActivities(data.activities ?? []);
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const res = await fetch("/api/booth/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                price: typeof price === "string" ? Number(price) : price,
                type,
            }),
        });

        setLoading(false);

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.message ?? "활동을 추가하지 못했습니다.");
            return;
        }

        setTitle("");
        setPrice("");
        setType("PAY");
        await fetchActivities();
    };

    const handleDelete = async (id: string) => {
        setError(null);
        const res = await fetch(`/api/booth/activities?id=${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.message ?? "삭제에 실패했습니다.");
            return;
        }

        await fetchActivities();
    };

    return (
        <div className="w-full max-w-3xl space-y-6">
            {/* 상단 헤더 + 순위 버튼 + 로그아웃 */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-gray-50">부스 대시보드</h1>
                    <p className="text-sm text-gray-600">
                        부스 ID: <span className="font-mono">{boothId}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/ranking"
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white hover:bg-gray-100"
                    >
                        반 부스 순위
                    </Link>
                    <LogoutButton />
                </div>
            </div>

            {/* 부스 잔액 + 순위 표시 */}
            <section className="p-4 border rounded-lg shadow-sm bg-white space-y-1">
                <h2 className="text-lg font-semibold text-gray-900">부스 보유 코인</h2>
                <p className="text-3xl font-bold text-blue-600">
                    {boothBalance.toLocaleString()} C
                </p>
                {rank && rank > 0 && (
                    <p className="text-sm text-gray-700">
                        우리 반 부스는 현재{" "}
                        <span className="font-bold">{rank}등</span> 입니다 🎉
                    </p>
                )}
            </section>

            {/* 새 상품 / 활동 등록 */}
            <section className="p-4 border rounded-lg shadow-sm bg-white space-y-4">
                <h2 className="font-semibold text-gray-900">새 상품 / 활동 등록</h2>
                <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4">
                    <input
                        className="border rounded-md px-2 py-1 text-sm md:col-span-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="상품 / 활동 이름"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <input
                        className="border rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        type="number"
                        min={0}
                        placeholder="가격(코인)"
                        value={price}
                        onChange={(e) =>
                            setPrice(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        required
                    />
                    <select
                        className="border rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        value={type}
                        onChange={(e) => setType(e.target.value as ActivityType)}
                    >
                        <option value="PAY">학생이 코인을 지불 (PAY)</option>
                        <option value="REWARD">학생이 코인을 받음 (REWARD)</option>
                    </select>
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 md:mt-0 md:col-span-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {loading ? "저장 중..." : "활동 추가"}
                    </button>
                </form>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </section>

            {/* 등록된 활동 목록 */}
            <section className="p-4 border rounded-lg shadow-sm bg-white space-y-3">
                <h2 className="font-semibold text-gray-900">등록된 활동</h2>
                {activities.length === 0 ? (
                    <p className="text-sm text-gray-500">등록된 활동이 없습니다.</p>
                ) : (
                    <ul className="space-y-2">
                        {activities.map((a) => (
                            <li
                                key={a.id}
                                className="flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-50"
                            >
                                <div>
                                    <div className="font-medium text-gray-900">{a.title}</div>
                                    <div className="text-xs text-gray-500">
                                        {a.price} 코인 ·{" "}
                                        {a.type === "PAY"
                                            ? "학생이 지불"
                                            : "학생이 받음 (리워드)"}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <a
                                        href={`/booth/qr/${a.id}`}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        QR 보기
                                    </a>

                                    <button
                                        onClick={() => handleDelete(a.id)}
                                        className="text-xs text-red-600 hover:underline"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
