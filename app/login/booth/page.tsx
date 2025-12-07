// app/login/booth/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function BoothLoginPage() {
    const [boothId, setBoothId] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await signIn("booth-login", {
            redirectTo: "/booth",
            boothId,
            password,
        });
        setLoading(false);
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md border rounded-xl p-6 shadow-sm bg-white space-y-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2 text-gray-900">
                        부스 로그인
                    </h1>
                    <p className="text-sm text-gray-700">
                        반 부스 ID와 초기 비밀번호(반장 전화번호 뒤 4자리)를 입력하세요.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            부스 ID (예: 1-1, 2-3)
                        </label>
                        <input
                            value={boothId}
                            onChange={(e) => setBoothId(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                        {loading ? "로그인 중..." : "부스 로그인"}
                    </button>
                </form>

                {/* 🔹 학생/선생님 로그인으로 가는 버튼 */}
                <div className="pt-2 border-t mt-4">
                    <p className="text-xs text-gray-600 mb-2">
                        학생/선생님은 아래 버튼을 눌러 개인 계정으로 로그인해 주세요.
                    </p>
                    <Link
                        href="/login/user"
                        className="block w-full py-2 rounded-md border text-center text-sm hover:bg-gray-50"
                    >
                        학생/선생님 로그인 페이지로 이동
                    </Link>
                </div>
            </div>
        </main>
    );
}
