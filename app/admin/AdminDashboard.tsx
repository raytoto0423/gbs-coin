// app/admin/AdminDashboard.tsx
"use client";

import { useState } from "react";

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: string;
    balance: number;
}

interface AdminBooth {
    id: string;
    name: string;
    balance: number;
}

interface AdminTransaction {
    id: string;
    title: string;
    amount: number;
    createdAt: string; // ISO string
    fromUserName: string | null;
    fromUserEmail: string | null;
    toUserName: string | null;
    toUserEmail: string | null;
    fromBoothId: string | null;
    fromBoothName: string | null;
    toBoothId: string | null;
    toBoothName: string | null;
}

interface AdminDashboardProps {
    users: AdminUser[];
    booths: AdminBooth[];
    transactions: AdminTransaction[];
}

export default function AdminDashboard({
                                           users,
                                           booths,
                                           transactions,
                                       }: AdminDashboardProps) {
    const [userList, setUserList] = useState<AdminUser[]>(users);
    const [boothList, setBoothList] = useState<AdminBooth[]>(booths);
    const [txList, setTxList] = useState<AdminTransaction[]>(transactions);

    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [userAmount, setUserAmount] = useState<string>("");

    const [searchTerm, setSearchTerm] = useState<string>("");

    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 🔍 이름/이메일 검색
    const filteredUsers = userList.filter((u) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q))
        );
    });

    const toggleUserSelect = (id: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const selectAllFilteredUsers = () => {
        const ids = filteredUsers.map((u) => u.id);
        setSelectedUserIds(ids);
    };

    const clearSelectedUsers = () => {
        setSelectedUserIds([]);
    };

    const handleUserBulk = async (mode: "SET" | "ADD" | "CLEAR") => {
        setError(null);
        setMessage(null);

        if (selectedUserIds.length === 0) {
            setError("먼저 학생/선생님을 한 명 이상 선택해 주세요.");
            return;
        }

        let amount: number | undefined = undefined;
        if (mode === "SET" || mode === "ADD") {
            if (!userAmount || isNaN(Number(userAmount))) {
                setError("금액을 숫자로 입력해 주세요.");
                return;
            }
            amount = Number(userAmount);
        }

        setBusy(true);
        try {
            const res = await fetch("/api/admin/bulk-users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userIds: selectedUserIds,
                    mode,
                    amount,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error ?? "유저 잔액 변경에 실패했습니다.");
                return;
            }

            setMessage("선택한 유저들의 잔액이 업데이트되었습니다.");

            if (data.users && Array.isArray(data.users)) {
                setUserList((prev) =>
                    prev.map((u) => {
                        const updated = data.users.find((x: any) => x.id === u.id);
                        if (updated) {
                            return { ...u, balance: updated.balance };
                        }
                        return u;
                    })
                );
            }
        } catch (e) {
            console.error(e);
            setError("요청 처리 중 오류가 발생했습니다.");
        } finally {
            setBusy(false);
        }
    };

    const handleResetAllUsers = async () => {
        if (!confirm("정말 모든 유저의 잔액을 0으로 초기화할까요?")) return;

        setError(null);
        setMessage(null);
        setBusy(true);
        try {
            const res = await fetch("/api/admin/reset-users", {
                method: "POST",
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error ?? "전체 유저 초기화에 실패했습니다.");
                return;
            }

            setMessage("모든 유저의 잔액이 0으로 초기화되었습니다.");

            setUserList((prev) => prev.map((u) => ({ ...u, balance: 0 })));
            setSelectedUserIds([]);
        } catch (e) {
            console.error(e);
            setError("요청 처리 중 오류가 발생했습니다.");
        } finally {
            setBusy(false);
        }
    };

    const handleResetAllBooths = async () => {
        if (!confirm("정말 모든 부스의 잔액을 0으로 초기화할까요?")) return;

        setError(null);
        setMessage(null);
        setBusy(true);
        try {
            const res = await fetch("/api/admin/reset-booths", {
                method: "POST",
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error ?? "부스 잔액 초기화에 실패했습니다.");
                return;
            }

            setMessage("모든 부스의 잔액이 0으로 초기화되었습니다.");
            setBoothList((prev) => prev.map((b) => ({ ...b, balance: 0 })));
        } catch (e) {
            console.error(e);
            setError("요청 처리 중 오류가 발생했습니다.");
        } finally {
            setBusy(false);
        }
    };

    const handleResetTransactions = async () => {
        if (!confirm("정말 모든 거래 내역을 삭제할까요?")) return;

        setError(null);
        setMessage(null);
        setBusy(true);

        try {
            const res = await fetch("/api/admin/reset-transactions", {
                method: "POST",
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error ?? "거래 내역 삭제에 실패했습니다.");
                return;
            }

            setMessage("모든 거래 내역이 삭제되었습니다.");
            setTxList([]);
        } catch (e) {
            console.error(e);
            setError("요청 처리 중 오류가 발생했습니다.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* 메시지 영역 */}
            {(message || error) && (
                <div className="space-y-1">
                    {message && (
                        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                            {message}
                        </p>
                    )}
                    {error && (
                        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                            {error}
                        </p>
                    )}
                </div>
            )}

            {/* 학생/선생님 잔액 관리 */}
            <section className="p-4 border rounded-lg shadow-sm bg-white space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        학생 / 선생님 잔액 관리
                    </h2>

                    <input
                        type="text"
                        placeholder="이름 또는 이메일 검색"
                        className="border rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <button
                        type="button"
                        onClick={selectAllFilteredUsers}
                        className="px-2 py-1 border rounded-md hover:bg-gray-100 bg-white"
                    >
                        현재 목록 전체 선택
                    </button>
                    <button
                        type="button"
                        onClick={clearSelectedUsers}
                        className="px-2 py-1 border rounded-md hover:bg-gray-100 bg-white"
                    >
                        선택 해제
                    </button>
                    <span className="text-gray-600">
            선택된 유저: {selectedUserIds.length}명
          </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <input
                        type="number"
                        className="border rounded-md px-2 py-1 w-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="금액"
                        value={userAmount}
                        onChange={(e) => setUserAmount(e.target.value)}
                    />
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleUserBulk("SET")}
                        className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                        선택 잔액 설정
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleUserBulk("ADD")}
                        className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
                    >
                        선택 잔액 추가
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleUserBulk("CLEAR")}
                        className="px-3 py-1.5 rounded-md bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-60"
                    >
                        선택 잔액 0으로
                    </button>

                    <button
                        type="button"
                        disabled={busy}
                        onClick={handleResetAllUsers}
                        className="ml-auto px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60"
                    >
                        모든 유저 잔액 0으로 초기화
                    </button>
                </div>

                <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 w-10 text-center">선택</th>
                            <th className="px-3 py-2 text-left">이름</th>
                            <th className="px-3 py-2 text-left">이메일</th>
                            <th className="px-3 py-2 text-left">역할</th>
                            <th className="px-3 py-2 text-right">잔액</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-3 py-4 text-center text-gray-500"
                                >
                                    조건에 맞는 유저가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((u) => (
                                <tr key={u.id} className="border-t">
                                    <td className="px-3 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedUserIds.includes(u.id)}
                                            onChange={() => toggleUserSelect(u.id)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">{u.name}</td>
                                    <td className="px-3 py-2">{u.email}</td>
                                    <td className="px-3 py-2 text-xs text-gray-600">
                                        {u.role}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono">
                                        {u.balance.toLocaleString()} C
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 부스 잔액 관리 */}
            <section className="p-4 border rounded-lg shadow-sm bg-white space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        반 부스 잔액 관리
                    </h2>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={handleResetAllBooths}
                        className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60"
                    >
                        모든 부스 잔액 0으로 초기화
                    </button>
                </div>

                <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left text-gray-900">부스 ID</th>
                            <th className="px-3 py-2 text-left text-gray-900">반 이름</th>
                            <th className="px-3 py-2 text-right text-gray-900">잔액</th>
                        </tr>
                        </thead>
                        <tbody>
                        {boothList.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-3 py-4 text-center text-gray-500"
                                >
                                    등록된 부스가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            boothList.map((b) => (
                                <tr key={b.id} className="border-t">
                                    <td className="px-3 py-2 font-mono text-gray-900">{b.id}</td>
                                    <td className="px-3 py-2 text-gray-900">{b.name}</td>
                                    <td className="px-3 py-2 text-right font-mono text-gray-900">
                                        {b.balance.toLocaleString()} C
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 전체 결제 / 거래 내역 */}
            <section className="p-4 border rounded-lg shadow-sm bg-white space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        전체 결제 / 거래 내역 (최근 50개)
                    </h2>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={handleResetTransactions}
                        className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60"
                    >
                        거래 내역 전체 삭제
                    </button>
                </div>

                {txList.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        아직 거래 내역이 없습니다.
                    </p>
                ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {txList.map((t) => {
                            const dateStr = new Date(t.createdAt).toLocaleString("ko-KR", {
                                timeZone: "Asia/Seoul",
                            });

                            let actors = "";
                            if (t.fromUserName || t.fromBoothName) {
                                actors += t.fromUserName
                                    ? `${t.fromUserName}(유저)`
                                    : `${t.fromBoothName}(부스)`;
                                actors += " → ";
                            }
                            if (t.toUserName || t.toBoothName) {
                                actors += t.toUserName
                                    ? `${t.toUserName}(유저)`
                                    : `${t.toBoothName}(부스)`;
                            }

                            return (
                                <div
                                    key={t.id}
                                    className="border rounded-md px-3 py-2 text-sm bg-white"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-gray-900">
                                            {t.title || "거래"}
                                        </p>
                                        <p className="font-mono font-semibold text-blue-700">
                                            {t.amount.toLocaleString()} C
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500">{dateStr}</p>
                                    {actors && (
                                        <p className="text-xs text-gray-600 mt-1">{actors}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
