"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
    return (
        <button
            onClick={() =>
                signOut({
                    callbackUrl: "/login/user", // 🔥 onrender 대신 로컬 경로
                })
            }
            className="px-3 py-2 bg-red-500 text-white rounded"
        >
            로그아웃
        </button>
    );
}
