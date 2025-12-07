// app/user/pay/PayClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PayClientProps {
    activityId: string;
    activityTitle: string;
    price: number;
    type: string;
    boothName: string;
    userBalance: number;
}

export default function PayClient({
                                      activityId,
                                      activityTitle,
                                      price,
                                      type,
                                      boothName,
                                      userBalance,
                                  }: PayClientProps) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleConfirm = async () => {
        setLoading(true);
        setMessage(null);
        setError(null);

        const res = await fetch("/api/user/pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ activityId }),
        });

        const data = await res.json().catch(() => ({}));

        setLoading(false);

        if (!res.ok) {
            setError(data.message ?? "결제에 실패했습니다.");
            return;
        }

        setMessage(data.message ?? "결제가 완료되었습니다.");
    };

    const handleCancel = () => {
        router.push("/user");
    };

    return (
        <div className="card w-full max-w-md border rounded-xl p-6 space-y-4 shadow-sm text-gray-900 dark:text-gray-100">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                결제 확인
            </h1>

            <div className="space-y-1 text-sm">
                <p>
                    <span className="font-semibold">부스:</span>{" "}
                    {boothName}
                </p>
                <p>
                    <span className="font-semibold">활동:</span>{" "}
                    {activityTitle}
                </p>
                <p>
                    <span className="font-semibold">가격:</span>{" "}
                    {price} 코인
                </p>
                <p>
                    <span className="font-semibold">타입:</span>{" "}
                    {type === "PAY"
                        ? "학생이 코인을 지불 (PAY)"
                        : "학생이 코인을 받음 (REWARD)"}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                    현재 내 잔액:{" "}
                    <span className="font-mono font-semibold">
                        {userBalance}
                    </span>{" "}
                    코인
                </p>
            </div>

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
            {message && (
                <p className="text-sm text-green-600">{message}</p>
            )}

            <div className="flex gap-2">
                <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="
                        flex-1 py-2 rounded-md bg-blue-600 text-white
                        text-sm font-semibold hover:bg-blue-700
                        disabled:opacity-60
                    "
                >
                    {loading
                        ? "처리 중..."
                        : type === "PAY"
                            ? "결제하기"
                            : "코인 받기"}
                </button>

                <button
                    onClick={handleCancel}
                    className="
                        flex-1 py-2 rounded-md border text-sm
                        hover:bg-gray-100 dark:hover:bg-slate-700
                        dark:border-slate-600
                    "
                >
                    취소
                </button>
            </div>
        </div>
    );
}
