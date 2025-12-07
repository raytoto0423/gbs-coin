// app/login/user/page.tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserLoginPage() {
    const { status } = useSession();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // ✅ 이미 로그인된 상태면 /user 로 이동
    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/user");
        }
    }, [status, router]);

    const handleLogin = async () => {
        setLoading(true);
        await signIn("google", { callbackUrl: "/user" });// 로그인 완료 후 다시 이 페이지로 돌아옴
        setLoading(false);
    };

    // 세션 상태 확인 중
    if (status === "loading") {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p>로그인 상태를 확인하는 중...</p>
            </main>
        );
    }

    // 이미 로그인된 상태면 위 useEffect가 /user로 보내버림
    return (
        <main className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md border rounded-xl p-6 shadow-sm">
                <h1 className="text-2xl font-bold mb-2">GBS 축제 코인 시스템</h1>
                <p className="text-sm text-gray-600 mb-6">
                    학교에서 발급된 구글 계정으로만 로그인할 수 있습니다.
                    <br />
                    (예: <code>gbs.s25XXXX@ggh.goe.go.kr</code>)
                </p>

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                    {loading ? "로그인 중..." : "구글 계정으로 로그인"}
                </button>
            </div>
        </main>
    );
}
