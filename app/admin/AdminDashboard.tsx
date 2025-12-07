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

type BulkMode = "SET" | "ADD" | "CLEAR";

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

    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [bulkMode, setBulkMode] = useState<BulkMode>("SET");
    const [bulkAmount, setBulkAmount] = useState<string>("");

    // ✅ 개별 유저 잔액 조정(기존 기능 유지)
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

    // ✅ 개별 부스 잔액 조정(기존)
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

    // ✅ 체크박스 선택 관련 로직
    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAllUsers = () => {
        if (selectedUserIds.length === userList.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(userList.map((u) => u.id));
        }
    };

    // ✅ 일괄 처리 실행
    const handleBulkApply = async () => {
        if (selectedUserIds.length === 0) {
            alert("먼저 학생/선생님을 선택해 주세요.");
            return;
        }

        let amountNum: number | undefined = undefined;

        if (bulkMode === "SET" || bulkMode === "ADD") {
            amountNum = Number(bulkAmount);
            if (!amountNum || !Number.isFinite(amountNum)) {
                alert("금액을 정확히 입력해 주세요.");
                return;
            }
            if (bulkMode === "SET" && amountNum < 0) {
                alert("초기 잔액은 0 이상이어야 합니다.");
                return;
            }
        }

        if (
            !confirm(
                `선택된 ${selectedUserIds.length}명에 대해 ` +
                (bulkMode === "SET"
                    ? `잔액을 ${amountNum} C로 설정`
                    : bulkMode === "ADD"
                        ? `잔액에 ${amountNum} C를 추가`
                        : "잔액을 0으로 초기화") +
                " 하시겠습니까?"
            )
        ) {
            return;
        }

        setLoadingId("bulk");
        setMessage(null);

        try {
            const res = await fetch("/api/admin/bulk-users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userIds: selectedUserIds,
                    mode: bulkMode,
                    amount: amountNum,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error ?? "오류가 발생했습니다.");
                return;
            }

            // 서버에서 돌려준 최신 유저 잔액으로 갱신
            setUserList((prev) =>
                prev.map((u) => {
                    const updated = data.users.find((x: any) => x.id === u.id);
                    return updated ? { ...u, balance: updated.balance } : u;
                })
            );
            setMessage("선택된 유저 잔액이 일괄 처리되었습니다.");
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

            {/* 🔹 1. 학생/선생님 잔액 관리 + 일괄 처리 */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold">학생/선생님 잔액 관리</h2>
                <p className="text-xs text-gray-500">
                    개별 조정 또는 여러 명 선택 후 일괄 처리할 수 있습니다.
                </p>

                {/* 일괄 처리 컨트롤 */}
                <div className="flex flex-wrap items-end gap-3 p-3 border rounded-md bg-gray-50">
                    <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-700">
              일괄 작업 대상:
            </span>
                        <span className="text-xs text-gray-600 ml-1">
              선택된 {selectedUserIds.length}명
            </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <label className="flex items-center gap-1">
                            <input
                                type="radio"
                                name="bulkMode"
                                value="SET"
                                checked={bulkMode === "SET"}
                                onChange={() => setBulkMode("SET")}
                            />
                            <span>잔액을</span>
                        </label>

                        <label className="flex items-center gap-1">
                            <input
                                type="radio"
                                name="bulkMode"
                                value="ADD"
                                checked={bulkMode === "ADD"}
                                onChange={() => setBulkMode("ADD")}
                            />
                            <span>잔액에 추가</span>
                        </label>

                        <label className="flex items-center gap-1">
                            <input
                                type="radio"
                                name="bulkMode"
                                value="CLEAR"
                                checked={bulkMode === "CLEAR"}
                                onChange={() => setBulkMode("CLEAR")}
                            />
                            <span>잔액 0으로</span>
                        </label>
                    </div>

                    {/* 금액 입력: SET/ADD일 때만 사용 */}
                    {bulkMode !== "CLEAR" && (
                        <input
                            type="number"
                            value={bulkAmount}
                            onChange={(e) => setBulkAmount(e.target.value)}
                            className="w-32 border rounded px-2 py-1 text-sm"
                            placeholder={bulkMode === "SET" ? "예: 5000" : "예: 1000"}
                        />
                    )}

                    <button
                        type="button"
                        onClick={handleBulkApply}
                        disabled={loadingId === "bulk"}
                        className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {loadingId === "bulk" ? "처리 중..." : "일괄 적용"}
                    </button>
                </div>

                {/* 유저 테이블 */}
                <div className="max-h-80 overflow-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedUserIds.length === userList.length && userList.length > 0}
                                    onChange={toggleSelectAllUsers}
                                />
                            </th>
                            <th className="p-2 text-left text-gray-900">이름</th>
                            <th className="p-2 text-left text-gray-900">이메일</th>
                            <th className="p-2 text-left text-gray-900">역할</th>
                            <th className="p-2 text-right text-gray-900">잔액</th>
                            <th className="p-2 text-center text-gray-900">개별 조정</th>
                        </tr>
                        </thead>
                        <tbody>
                        {userList.map((u) => (
                            <tr key={u.id} className="border-t">
                                <td className="p-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.includes(u.id)}
                                        onChange={() => toggleUserSelection(u.id)}
                                    />
                                </td>
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
                                <td className="p-2 text-center text-gray-500" colSpan={6}>
                                    아직 등록된 유저가 없습니다.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 🔹 2. 부스 잔액 관리 (기존 그대로 유지) */}
            <section className="space-y-3">
                <h2 className="text-xl font-bold">부스 잔액 관리</h2>
                <p className="text-xs text-gray-500">
                    부스별 잔액을 개별 조정할 수 있습니다.
                </p>

                <div className="max-h-80 overflow-auto border rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left text-gray-900">부스 ID</th>
                            <th className="p-2 text-left text-gray-900">이름</th>
                            <th className="p-2 text-right text-gray-900">잔액</th>
                            <th className="p-2 text-center text-gray-900">조정</th>
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
