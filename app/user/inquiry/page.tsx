"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InquiryPage() {
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!message.trim()) return alert("문의 내용을 입력해주세요.");

        setSubmitting(true);

        try {
            const res = await fetch("/api/inquiry", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            });

            if (!res.ok) {
                throw new Error("문의 전송 실패");
            }

            alert("문의가 접수되었습니다!");
            router.push("/user"); // 🔥 문의 후 user 페이지로 이동

        } catch (error) {
            console.error(error);
            alert("문의 전송 중 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
            <h1 className="text-xl font-bold text-gray-100">
                관리자에게 문의 보내기
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    className="w-full p-3 rounded-md border bg-white text-gray-800"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="문의 내용을 입력하세요..."
                />

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500"
                >
                    {submitting ? "전송 중..." : "문의 보내기"}
                </button>
            </form>
        </main>
    );
}
