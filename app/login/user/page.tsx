// app/login/user/page.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function UserLoginPage() {
    const { status } = useSession();
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        await signIn("google", { callbackUrl: "/user" });
        setLoading(false);
    };

    const handleLogout = () => {
        signOut({ callbackUrl: "/login/user" });
    };

    return (
        <main className="min-h-screen flex items-center justify-center px-4 text-gray-900 dark:text-gray-100">
            <div className="card w-full max-w-md border rounded-xl p-6 shadow-sm space-y-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                        GBS 축제 코인 시스템
                    </h1>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        학교에서 발급된 구글 계정으로만 로그인할 수 있습니다.
                        <br />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                            (예:{" "}
                            <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-slate-800 dark:text-gray-100">
                                gbs.s25XXXX@ggh.goe.go.kr
                            </code>
                            )
                        </span>
                    </p>
                </div>

                {/* 🔹 부스 로그인으로 가는 버튼 */}
                <div className="space-y-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        반 부스 담당자는 부스 전용 로그인 페이지를 이용해 주세요.
                    </p>
                    <Link
                        href="/login/booth"
                        className="block w-full py-2 rounded-md border text-center text-sm border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                        부스 로그인 페이지로 이동
                    </Link>
                </div>

                {/* 🔹 학생/선생님/관리자 로그인 영역 */}
                {status === "authenticated" ? (
                    <div className="space-y-3">
                        <Link
                            href="/user"
                            className="block w-full py-2 rounded-md bg-green-600 text-white font-semibold text-center hover:bg-green-700"
                        >
                            내 정보로 이동
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700"
                        >
                            로그아웃
                        </button>
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
