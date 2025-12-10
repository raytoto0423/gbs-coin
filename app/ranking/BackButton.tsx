// app/ranking/BackButton.tsx
"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
    const router = useRouter();

    const handleClick = () => {
        // 히스토리가 있으면 뒤로가기, 없으면 기본 학생 페이지로
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push("/user");
        }
    };

    return (
        <button
            onClick={handleClick}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-900 hover:bg-gray-100"
        >
            이전 화면으로
        </button>
    );
}
