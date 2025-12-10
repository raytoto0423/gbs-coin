// app/admin/AdminActions.tsx
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
    } catch {
        // ignore
    }

    if (!res.ok) {
        throw new Error(data.message || `요청 실패 (${res.status})`);
    }
    return data;
}

export default function AdminActions() {
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // 부스 잔액 조정용 상태
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
        setMessage(
            `모든 유저 잔액 초기화 완료 (총 ${data.count ?? "?"}명). 페이지를 새로고침하면 반영됩니다.`
        );
    });

    const resetBooths = wrap(async () => {
        const data = await callApi("/api/admin/reset-booths");
        setMessage(
            `모든 부스 잔액 초기화 완료 (총 ${data.count ?? "?"}개). 페이지를 새로고침하면 반영됩니다.`
        );
    });

    const handleAdjustBooth = wrap(async () => {
        if (!boothId.trim()) {
            throw new Error("부스 ID를 입력해 주세요. 예: 1-1, 2-3");
        }

        const payload: any = {
            boothId: boothId.trim(),
            mode,
        };

        if (mode === "SET" || mode === "ADD") {
            if (amount === "" || isNaN(Number(amount))) {
                throw new Error("금액을 숫자로 입력해 주세요.");
            }
            payload.amount = Number(amount);
        }

        const data = await callApi("/api/admin/adjust-booth", {
            body: JSON.stringify(payload),
        });

        setMessage(
            `부스 ${data.booth.id} (${data.booth.name}) 잔액: ${data.booth.balance} C`
        );
    });

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-50">관리자 액션</h2>

            <div className="grid gap-3 sm:grid-cols-2">
                {/* 전체 초기화 버튼들 */}
                <button
                    onClick={resetUsers}
                    disabled={loading}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-900"
                >
                    모든 유저 잔액 0으로 초기화
                </button>

                <button
                    onClick={resetBooths}
                    disabled={loading}
                    className="rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-orange-900"
                >
                    모든 부스 잔액 0으로 초기화
                </button>
            </div>

            {/* 부스 잔액 조정 폼 */}
            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-100">
                    특정 부스 잔액 조정 (부스에 코인 보내기)
                </h3>
                <p className="text-xs text-gray-400">
                    예: ID 에 <code className="font-mono">1-3</code> 입력 후, 모드를
                    &quot;ADD&quot; 로 두고 금액 100을 넣으면 1-3 부스에 100C를 추가로
                    지급합니다.
                </p>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <label className="block text-xs text-gray-300 mb-1">
                            부스 ID (예: 1-1, 2-3)
                        </label>
                        <input
                            className="w-full rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-gray-50 outline-none focus:border-emerald-400"
                            value={boothId}
                            onChange={(e) => setBoothId(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-300 mb-1">모드</label>
                        <select
                            value={mode}
                            onChange={(e) =>
                                setMode(e.target.value as "SET" | "ADD" | "CLEAR")
                            }
                            className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-gray-50 outline-none focus:border-emerald-400"
                        >
                            <option value="ADD">ADD (기존 잔액에 더하기)</option>
                            <option value="SET">SET (잔액을 이 값으로 설정)</option>
                            <option value="CLEAR">CLEAR (해당 부스만 0으로)</option>
                        </select>
                    </div>

                    {(mode === "ADD" || mode === "SET") && (
                        <div>
                            <label className="block text-xs text-gray-300 mb-1">금액</label>
                            <input
                                type="number"
                                className="w-28 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-gray-50 outline-none focus:border-emerald-400"
                                value={amount}
                                onChange={(e) =>
                                    setAmount(
                                        e.target.value === "" ? "" : Number(e.target.value)
                                    )
                                }
                            />
                        </div>
                    )}

                    <button
                        onClick={handleAdjustBooth}
                        disabled={loading}
                        className="sm:ml-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:bg-emerald-900"
                    >
                        부스 잔액 적용
                    </button>
                </div>
            </div>

            {message && (
                <p className="text-xs text-emerald-400 whitespace-pre-line">{message}</p>
            )}
            {error && (
                <p className="text-xs text-red-400 whitespace-pre-line">{error}</p>
            )}
        </section>
    );
}
