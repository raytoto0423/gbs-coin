"use client";

import { useState } from "react";

async function callApi(url: string, options?: RequestInit) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    let data: any = {};
    try {
        data = await res.json();
    } catch {}

    if (!res.ok) {
        throw new Error(data.message || `요청 실패 (${res.status})`);
    }
    return data;
}

export default function AdminActions() {
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [boothId, setBoothId] = useState("");
    const [amount, setAmount] = useState<number | "">("");
    const [mode, setMode] = useState<"SET" | "ADD" | "CLEAR">("ADD");

    const wrap = (fn: () => Promise<void>) => async () => {
        setLoading(true);
        setMessage(null);
        setError(null);
        try {
            await fn();
        } catch (e: any) {
            setError(e.message || "오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const resetUsers = wrap(async () => {
        const data = await callApi("/api/admin/reset-users");
        setMessage(`모든 유저 잔액 초기화 완료.`);
    });

    const resetBooths = wrap(async () => {
        const data = await callApi("/api/admin/reset-booths");
        setMessage(`모든 부스 잔액 초기화 완료.`);
    });

    const handleAdjustBooth = wrap(async () => {
        if (!boothId.trim()) throw new Error("부스 ID를 입력하세요.");

        const payload: any = { boothId: boothId.trim(), mode };
        if (mode !== "CLEAR") {
            if (amount === "" || isNaN(Number(amount))) {
                throw new Error("금액을 입력하세요.");
            }
            payload.amount = Number(amount);
        }

        const data = await callApi("/api/admin/adjust-booth", {
            body: JSON.stringify(payload),
        });

        setMessage(`부스 ${data.booth.id} 잔액: ${data.booth.balance}C`);
    });

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold">관리자 액션</h2>

            <div className="grid gap-3 sm:grid-cols-2">
                <button
                    onClick={resetUsers}
                    disabled={loading}
                    className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                >
                    모든 유저 잔액 초기화
                </button>

                <button
                    onClick={resetBooths}
                    disabled={loading}
                    className="rounded-md bg-orange-600 px-3 py-2 text-white hover:bg-orange-700"
                >
                    모든 부스 잔액 초기화
                </button>
            </div>

            <div className="rounded-lg border border-slate-700 p-4 space-y-2">
                <h3 className="font-semibold text-sm">부스 잔액 조정</h3>

                <input
                    value={boothId}
                    onChange={(e) => setBoothId(e.target.value)}
                    placeholder="예: 1-1"
                    className="w-full rounded bg-slate-800 px-2 py-1 text-sm"
                />

                <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="w-full rounded bg-slate-800 px-2 py-1 text-sm"
                >
                    <option value="ADD">ADD (기존 잔액 + amount)</option>
                    <option value="SET">SET (잔액을 amount로 설정)</option>
                    <option value="CLEAR">CLEAR (0으로 초기화)</option>
                </select>

                {mode !== "CLEAR" && (
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) =>
                            setAmount(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        placeholder="금액"
                        className="w-full rounded bg-slate-800 px-2 py-1 text-sm"
                    />
                )}

                <button
                    onClick={handleAdjustBooth}
                    disabled={loading}
                    className="rounded-md bg-emerald-500 px-3 py-2 text-white hover:bg-emerald-600"
                >
                    적용하기
                </button>
            </div>

            {message && <p className="text-emerald-400 text-sm">{message}</p>}
            {error && <p className="text-red-400 text-sm">{error}</p>}
        </section>
    );
}
