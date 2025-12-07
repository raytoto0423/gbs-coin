// app/login/user/page.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function UserLoginPage() {
    const { status } = useSession();
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        await signIn("google", { callbackUrl: "/user" });
        setLoading(false);
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md border rounded-xl p-6 shadow-sm bg-white">
                <h1 className="text-2xl font-bold mb-2 text-gray-900">GBS 축제 코인 시스템</h1>
                <p className="text-sm text-gray-600 mb-6">
                    학교에서 발급된 구글 계정으로만 로그인할 수 있습니다.
                    <br />
                    (예: <code>gbs.s25XXXX@ggh.goe.go.kr</code>)
                </p>

                {/* ✔ 로그인 상태일 때 버튼 바뀜 (자동 리다이렉트 없음) */}
                {status === "authenticated" ? (
                    <div className="space-y-3">
                        <Link
                            href="/user"
                            className="block w-full py-2 rounded-md bg-green-600 text-white font-semibold text-center hover:bg-green-700"
                        >
                            내 정보로 이동
                        </Link>

                        <form action="/api/auth/signout?callbackUrl=/login/user" method="post">
                            <button
                                type="submit"
                                className="w-full py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700"
                            >
                                로그아웃
                            </button>
                        </form>
                    </div>
                ) : (
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                        {loading ? "로그인 중..." : "구글 계정으로 로그인"}
                    </button>
                )}
            </div>
        </main>
    );
}
