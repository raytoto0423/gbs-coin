// app/booth/BoothDashboard.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import LogoutButton from "../../components/LogoutButton";

type ActivityType = "PAY" | "REWARD";

interface Activity {
    id: string;
    title: string;
    price: number;
    type: ActivityType;
}

interface BoothDashboardProps {
    boothId: string;
}

export default function BoothDashboard({ boothId }: BoothDashboardProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState<number | "">("");
    const [type, setType] = useState<ActivityType>("PAY");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchActivities = async () => {
        const res = await fetch("/api/booth/activities");
        if (!res.ok) {
            setError("활동 목록을 불러오지 못했습니다.");
            return;
        }
        const data = await res.json();
        setActivities(data.activities);
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
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900">부스 대시보드</h1>
                <p className="text-sm text-gray-600">
                    부스 ID: <span className="font-mono">{boothId}</span>
                </p>
            </div>

            <LogoutButton />

            {/* 새 상품/활동 등록 카드 */}
            <section className="card border rounded-lg p-4 space-y-4">
                <h2 className="font-semibold">새 상품 / 활동 등록</h2>
                <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4">
                    <input
                        className="border rounded-md px-2 py-1 text-sm md:col-span-2"
                        placeholder="상품 / 활동 이름"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <input
                        className="border rounded-md px-2 py-1 text-sm"
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
                        className="border rounded-md px-2 py-1 text-sm"
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

            {/* 등록된 활동 리스트 카드 */}
            <section className="card border rounded-lg p-4 space-y-3">
                <h2 className="font-semibold">등록된 활동</h2>
                {activities.length === 0 ? (
                    <p className="text-sm text-gray-500">등록된 활동이 없습니다.</p>
                ) : (
                    <ul className="space-y-2">
                        {activities.map((a) => (
                            <li
                                key={a.id}
                                className="card flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                            >
                                <div>
                                    <div className="font-medium">{a.title}</div>
                                    <div className="text-xs text-gray-500">
                                        {a.price} 코인 ·{" "}
                                        {a.type === "PAY" ? "학생이 지불" : "학생이 받음"}
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
