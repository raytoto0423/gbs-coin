// components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton({
                                         className = "",
                                         redirectTo = "/login/user",
                                     }: {
    className?: string;
    redirectTo?: string;
}) {
    const handleLogout = () => {
        signOut({ callbackUrl: redirectTo });
    };

    return (
        <button
            type="button"
            onClick={handleLogout}
            className={
                className ||
                "inline-block px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow"
            }
        >
            로그아웃
        </button>
    );
}
