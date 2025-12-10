// app/user/ClassPresidentPanel.tsx
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
        <section className="p-4 border rounded-lg bg-slate-900/60 text-sm text-slate-100 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-slate-300 mb-1">
                        현재 <span className="font-semibold">{grade}학년 {classRoom}반 회장</span> 계정입니다.
                    </p>
                    <p className="text-xs text-slate-400">
                        아래에서 <b>{grade}학년 {classRoom}반 부스</b>의 로그인 비밀번호를 변경할 수 있습니다.
                        (기본값은 <code className="font-mono">1234</code> 입니다.)
                    </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
          회장 권한
        </span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-xs">
                <label className="text-xs text-slate-300">
                    새 부스 비밀번호
                    <input
                        type="password"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                        placeholder="4~20자 비밀번호"
                    />
                </label>

                <button
                    type="submit"
                    disabled={loading || pw.length < 4}
                    className="mt-1 inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:bg-emerald-900"
                >
                    {loading ? "변경 중..." : "부스 비밀번호 변경"}
                </button>

                {msg && <p className="text-xs text-emerald-400">{msg}</p>}
                {error && <p className="text-xs text-red-400">{error}</p>}
            </form>

            <p className="text-[11px] text-slate-500">
                변경한 비밀번호는 <b>해당 반 부스 담당 친구/선생님</b>에게만 공유해 주세요.
            </p>
        </section>
    );
}
