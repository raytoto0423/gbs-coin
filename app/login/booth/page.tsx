// app/login/booth/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function BoothLoginPage() {
    const [boothId, setBoothId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const res = await signIn("booth-login", {
            boothId,
            password,
            redirect: false,
        });

        setLoading(false);

        if (res?.error) {
            setError("부스 ID 또는 비밀번호가 올바르지 않습니다.");
            return;
        }

        // 성공 시 부스 대시보드로 이동 (나중에 /booth 페이지 만들 예정)
        router.push("/booth");
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md border rounded-xl p-6 shadow-sm space-y-4"
            >
                <h1 className="text-2xl font-bold mb-2">부스 로그인</h1>
                <p className="text-sm text-gray-600">
                    반 부스 ID와 비밀번호(반장 휴대폰 뒷 4자리)를 입력하세요.
                    <br />
                    예: <code>1-1</code>, <code>2-3</code>
                </p>

                <div className="space-y-1">
                    <label className="block text-sm font-medium">부스 ID</label>
                    <input
                        value={boothId}
                        onChange={(e) => setBoothId(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        placeholder="예: 1-1"
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium">비밀번호</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        placeholder="반장 휴대폰 뒷 4자리"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
                >
                    {loading ? "로그인 중..." : "로그인"}
                </button>
            </form>
        </main>
    );
}
