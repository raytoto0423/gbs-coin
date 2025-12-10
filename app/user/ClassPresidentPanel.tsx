"use client";

import { useState } from "react";

interface Props {
    grade: number;
    classRoom: number;
}

export default function ClassPresidentPanel({ grade, classRoom }: Props) {
    const [pw, setPw] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        setError(null);

        try {
            const res = await fetch("/api/booth/set-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword: pw }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.message || "비밀번호 변경에 실패했습니다.");
            }

            setMsg("부스 비밀번호가 성공적으로 변경되었습니다.");
            setPw("");
        } catch (err: any) {
            setError(err.message || "오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <div className="font-semibold mb-2">
                {grade}학년 {classRoom}반{" "}
                <span className="ml-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
          회장 권한
        </span>
            </div>
            <p className="text-sm text-slate-300 mb-3">
                아래에서 <b>{grade}학년 {classRoom}반 부스</b>의 비밀번호를 변경할 수 있습니다.
                (초기 비밀번호는 <code>1234</code> 입니다.)
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-xs">
                <input
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                    placeholder="새 부스 비밀번호"
                />
                <button
                    type="submit"
                    disabled={loading || pw.length < 4}
                    className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-white disabled:bg-emerald-900"
                >
                    {loading ? "변경 중..." : "부스 비밀번호 변경"}
                </button>

                {msg && <p className="text-xs text-emerald-400">{msg}</p>}
                {error && <p className="text-xs text-red-400">{error}</p>}
            </form>
        </div>
    );
}
