// app/admin/AdminUserActions.tsx
"use client";

import { useState } from "react";

type Mode = "SET" | "ADD" | "CLEAR";

async function callApi(url: string, body: any) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

export default function AdminUserActions() {
    const [email, setEmail] = useState("");
    const [mode, setMode] = useState<Mode>("ADD");
    const [amount, setAmount] = useState<number | "">("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        setError(null);

        try {
            if (!email.trim()) {
                throw new Error("이메일을 입력해 주세요.");
            }

            const payload: any = {
                email: email.trim(),
                mode,
            };

            if (mode === "SET" || mode === "ADD") {
                if (amount === "" || isNaN(Number(amount))) {
                    throw new Error("금액을 숫자로 입력해 주세요.");
                }
                payload.amount = Number(amount);
            }

            const data = await callApi("/api/admin/adjust-user", payload);
            const u = data.user;

            setMsg(
                `✅ ${u.name ?? ""} (${u.email}) 잔액: ${u.balance} C로 변경되었습니다.`
            );
        } catch (e: any) {
            setError(e.message || "오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="rounded-lg border border-slate-700 bg-slate-900/70 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-50">
                유저 잔액 개별 조정
            </h2>
            <p className="text-xs text-slate-400">
                학생/선생님 이메일을 기준으로 잔액을 직접 조정할 수 있습니다.
                (관리자 본인 계정은 변경 불가)
            </p>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
                <div className="flex-1">
                    <label className="block text-xs text-slate-300 mb-1">
                        유저 이메일
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="예: gbs.s25xxxx@ggh.goe.go.kr"
                        className="w-full rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-emerald-400"
                    />
                </div>

                <div>
                    <label className="block text-xs text-slate-300 mb-1">모드</label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as Mode)}
                        className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-emerald-400"
                    >
                        <option value="ADD">ADD (기존 잔액에 더하기)</option>
                        <option value="SET">SET (잔액을 이 값으로 설정)</option>
                        <option value="CLEAR">CLEAR (해당 유저만 0으로)</option>
                    </select>
                </div>

                {(mode === "SET" || mode === "ADD") && (
                    <div>
                        <label className="block text-xs text-slate-300 mb-1">금액</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) =>
                                setAmount(
                                    e.target.value === "" ? "" : Number(e.target.value)
                                )
                            }
                            placeholder="예: 100"
                            className="w-24 rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-emerald-400"
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="sm:ml-2 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:bg-emerald-900"
                >
                    {loading ? "적용 중..." : "적용하기"}
                </button>
            </form>

            {msg && <p className="text-xs text-emerald-400">{msg}</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}
        </section>
    );
}
