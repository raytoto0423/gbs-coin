// components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
    const handleLogout = () => {
        // 로그아웃 후 메인 페이지(/)로 이동
        signOut({ callbackUrl: "/" });
    };

    return (
        <button
            onClick={handleLogout}
            className="px-3 py-1 rounded-md border text-sm hover:bg-gray-100"
        >
            로그아웃
        </button>
    );
}
