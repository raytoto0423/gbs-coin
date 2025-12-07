// app/admin/AdminDashboard.tsx
"use client";

import { useState } from "react";

type UserSummary = {
    id: string;
    name: string;
    email: string;
    role: string;
    balance: number;
};

type BoothSummary = {
    id: string;
    name: string;
    balance: number;
};

export default function AdminDashboard({
                                           users,
                                           booths,
                                       }: {
    users: UserSummary[];
    booths: BoothSummary[];
}) {
    const [userList, setUserList] = useState(users);
    const [boothList, setBoothList] = useState(booths);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const adjustUser = async (userId: string, deltaStr: string) => {
        const delta = Number(deltaStr);
        if (!delta || !Number.isFinite(delta)) {
            alert("정확한 숫자를 입력해 주세요.");
            return;
        }

        setLoadingId(`user-${userId}`);
        setMessage(null);

        try {
            const res = await fetch("/api/admin/adjust-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, delta }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error ?? "오류가 발생했습니다.");
                return;
            }

            setUserList((prev) =>
                prev.map((u) =>
                    u.id === userId ? { ...u, balance: data.balance } : u
                )
            );
            setMessage(`유저 잔액이 ${delta > 0 ? "충전" : "차감"}되었습니다.`);
        } finally {
            setLoadingId(null);
        }
    };

    const adjustBooth = async (boothId: string, deltaStr: string) => {
        const delta = Number(deltaStr);
        if (!delta || !Number.isFinite(delta)) {
            alert("정확한 숫자를 입력해 주세요.");
            return;
        }

        setLoadingId(`booth-${boothId}`);
        setMessage(null);

        try {
            const res = await fetch("/api/admin/adjust-booth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ boothId, delta }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error ?? "오류가 발생했습니다.");
                return;
            }

            setBoothList((prev) =>
                prev.map((b) =>
                    b.id === boothId ? { ...b, balance: data.balance } : b
                )
            );
            setMessage(`부스 잔액이 ${delta > 0 ? "충전" : "차감"}되었습니다.`);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-8">
            {message && (
                <div className="p-2 rounded-md bg-green-50 text-sm text-green-700 border border-green-200">
                    {message}
                </div>
            )}

            {/* 유저 잔액 조정 */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold">학생/선생님 잔액 관리</h2>
                <p className="text-xs text-gray-500">
                    양수는 충전, 음수는 차감입니다. 예) 1000, -500
                </p>

                <div className="max-h-80 overflow-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">이름</th>
                            <th className="p-2 text-left">이메일</th>
                            <th className="p-2 text-left">역할</th>
                            <th className="p-2 text-right">잔액</th>
                            <th className="p-2 text-center">조정</th>
                        </tr>
                        </thead>
                        <tbody>
                        {userList.map((u) => (
                            <tr key={u.id} className="border-t">
                                <td className="p-2">{u.name || "-"}</td>
                                <td className="p-2">{u.email}</td>
                                <td className="p-2">
                                    {u.role === "STUDENT"
                                        ? "학생"
                                        : u.role === "TEACHER"
                                            ? "선생님"
                                            : u.role}
                                </td>
                                <td className="p-2 text-right">
                                    {u.balance.toLocaleString()} C
                                </td>
                                <td className="p-2 text-center">
                                    <form
                                        className="inline-flex items-center gap-1"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.currentTarget);
                                            const deltaStr = String(formData.get("delta") ?? "0");
                                            adjustUser(u.id, deltaStr);
                                            e.currentTarget.reset();
                                        }}
                                    >
                                        <input
                                            name="delta"
                                            type="number"
                                            className="w-24 border rounded px-1 py-0.5 text-xs"
                                            placeholder="+1000 / -500"
                                        />
                                        <button
                                            type="submit"
                                            className="px-2 py-1 text-xs rounded bg-blue-600 text-white disabled:opacity-50"
                                            disabled={loadingId === `user-${u.id}`}
                                        >
                                            적용
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {userList.length === 0 && (
                            <tr>
                                <td className="p-2 text-center text-gray-500" colSpan={5}>
                                    아직 등록된 유저가 없습니다.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 부스 잔액 조정 */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold">부스 잔액 관리</h2>
                <p className="text-xs text-gray-500">
                    양수는 충전, 음수는 차감입니다. 예) 5000, -1000
                </p>

                <div className="max-h-80 overflow-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">부스 ID</th>
                            <th className="p-2 text-left">이름</th>
                            <th className="p-2 text-right">잔액</th>
                            <th className="p-2 text-center">조정</th>
                        </tr>
                        </thead>
                        <tbody>
                        {boothList.map((b) => (
                            <tr key={b.id} className="border-t">
                                <td className="p-2">{b.id}</td>
                                <td className="p-2">{b.name}</td>
                                <td className="p-2 text-right">
                                    {b.balance.toLocaleString()} C
                                </td>
                                <td className="p-2 text-center">
                                    <form
                                        className="inline-flex items-center gap-1"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.currentTarget);
                                            const deltaStr = String(formData.get("delta") ?? "0");
                                            adjustBooth(b.id, deltaStr);
                                            e.currentTarget.reset();
                                        }}
                                    >
                                        <input
                                            name="delta"
                                            type="number"
                                            className="w-24 border rounded px-1 py-0.5 text-xs"
                                            placeholder="+5000 / -1000"
                                        />
                                        <button
                                            type="submit"
                                            className="px-2 py-1 text-xs rounded bg-blue-600 text-white disabled:opacity-50"
                                            disabled={loadingId === `booth-${b.id}`}
                                        >
                                            적용
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {boothList.length === 0 && (
                            <tr>
                                <td className="p-2 text-center text-gray-500" colSpan={4}>
                                    아직 등록된 부스가 없습니다.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
