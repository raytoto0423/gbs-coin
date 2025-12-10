// app/user/inquiry/InquiryForm.tsx
"use client";

import { FormEvent, useState } from "react";

export default function InquiryForm() {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!message.trim() || loading) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch("/api/inquiry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error ?? "전송에 실패했습니다.");
            }

            setSuccess(true);
            setMessage("");
        } catch (err: any) {
            setError(err.message ?? "문제가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 p-4 bg-white rounded-lg shadow"
        >
            <label className="block text-sm font-medium text-gray-900">
                문의 내용
                <textarea
                    className="mt-1 w-full min-h-[140px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예) 3학년 2반 부스에서 결제가 안 됩니다...."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
            </label>

            {error && (
                <p className="text-sm text-red-600">
                    {error}
                </p>
            )}
            {success && (
                <p className="text-sm text-green-600">
                    문의가 전송되었습니다. 관리자가 확인 후 조치할 예정입니다.
                </p>
            )}

            <button
                type="submit"
                disabled={loading || !message.trim()}
                className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
            >
                {loading ? "전송 중..." : "문의 보내기"}
            </button>
        </form>
    );
}
