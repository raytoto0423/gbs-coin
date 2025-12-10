// app/admin/AdminUserActions.tsx
"use client";

import { useState } from "react";

type BulkMode = "SET" | "ADD" | "CLEAR";

interface UserItem {
    id: string;
    name: string | null;
    email: string;
    grade: number | null;
    classRoom: number | null;
    classRole: string | null;
    role: string;
    balance: number;
}

async function postJson(url: string, body: any) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    let data: any = {};
    try {
        data = await res.json();
    } catch {}

    if (!res.ok) {
        throw new Error(data.message || data.error || `요청 실패 (${res.status})`);
    }
    return data;
}

export default function AdminUserActions() {
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [users, setUsers] = useState<UserItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [mode, setMode] = useState<BulkMode>("ADD");
    const [amount, setAmount] = useState<number | "">("");
    const [loadingApply, setLoadingApply] = useState(false);

    const [msg, setMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedIds.length === users.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(users.map((u) => u.id));
        }
    };

    const handleSearch = async () => {
        setSearching(true);
        setMsg(null);
        setError(null);
        setSelectedIds([]);

        try {
            if (!query.trim()) {
                throw new Error("이름(또는 일부)을 입력해 주세요.");
            }

            const res = await fetch(
                `/api/admin/search-users?q=${encodeURIComponent(query.trim())}`
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "검색에 실패했습니다.");
            }

            setUsers(data.users || []);
            if ((data.users || []).length === 0) {
                setMsg("검색 결과가 없습니다.");
            }
        } catch (e: any) {
            setError(e.message || "검색 중 오류가 발생했습니다.");
            setUsers([]);
        } finally {
            setSearching(false);
        }
    };

    const handleApply = async () => {
        setLoadingApply(true);
        setMsg(null);
        setError(null);

        try {
            if (selectedIds.length === 0) {
                throw new Error("적용할 유저를 최소 1명 선택해 주세요.");
            }

            const payload: any = {
                userIds: selectedIds,
                mode,
            };

            if (mode === "SET" || mode === "ADD") {
                if (amount === "" || isNaN(Number(amount))) {
                    throw new Error("금액을 숫자로 입력해 주세요.");
                }
                payload.amount = Number(amount);
            }

            const data = await postJson("/api/admin/bulk-users", payload);

            const updatedUsers: UserItem[] = data.users || [];

            // 화면에 보여지는 users와 매칭해서 잔액 업데이트
            setUsers((prev) =>
                prev.map((u) => {
                    const found = updatedUsers.find((x) => x.id === u.id);
                    return found ? { ...u, balance: found.balance } : u;
                })
            );

            setMsg(
                `선택한 ${selectedIds.length}명의 잔액이 성공적으로 반영되었습니다.`
            );
        } catch (e: any) {
            setError(e.message || "잔액 적용 중 오류가 발생했습니다.");
        } finally {
            setLoadingApply(false);
        }
    };

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-50">
                유저 잔액 관리 (이름 검색 → 선택 → 일괄 적용)
            </h2>

            {/* 검색 영역 */}
            <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4 space-y-2">
                <p className="text-xs text-slate-400">
                    학생/선생님 이름으로 검색한 뒤, 결과에서 대상자를 선택하고 한 번에
                    잔액을 조정할 수 있습니다.
                </p>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="예: 홍길동 (이름 전체 또는 일부)"
                        className="flex-1 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-50 outline-none focus:border-emerald-400"
                    />
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={searching}
                        className="sm:ml-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-900"
                    >
                        {searching ? "검색 중..." : "검색"}
                    </button>
                </div>
            </div>

            {/* 검색 결과 + 선택 + 잔액 적용 */}
            {users.length > 0 && (
                <div className="space-y-3">
                    {/* 잔액 적용 컨트롤 */}
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4 space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <div>
                                <label className="block text-xs text-slate-300 mb-1">
                                    모드
                                </label>
                                <select
                                    value={mode}
                                    onChange={(e) =>
                                        setMode(e.target.value as BulkMode)
                                    }
                                    className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-emerald-400"
                                >
                                    <option value="ADD">ADD (기존 잔액에 더하기)</option>
                                    <option value="SET">SET (잔액을 이 값으로 설정)</option>
                                    <option value="CLEAR">CLEAR (0으로 초기화)</option>
                                </select>
                            </div>

                            {(mode === "SET" || mode === "ADD") && (
                                <div>
                                    <label className="block text-xs text-slate-300 mb-1">
                                        금액
                                    </label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(
                                                e.target.value === "" ? "" : Number(e.target.value)
                                            )
                                        }
                                        placeholder="예: 100"
                                        className="w-28 rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-slate-50 outline-none focus:border-emerald-400"
                                    />
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleApply}
                                disabled={loadingApply}
                                className="sm:ml-2 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:bg-emerald-900"
                            >
                                {loadingApply
                                    ? "적용 중..."
                                    : `선택된 ${selectedIds.length}명에게 적용`}
                            </button>
                        </div>

                        <p className="text-[11px] text-slate-500">
                            ※ CLEAR는 선택된 학생들의 잔액을 0으로 만듭니다. 신중히 사용하세요.
                        </p>
                    </div>

                    {/* 검색 결과 목록 */}
                    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/60">
                        <table className="min-w-full text-xs">
                            <thead>
                            <tr className="bg-slate-800/80">
                                <th className="px-2 py-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={
                                            selectedIds.length > 0 &&
                                            selectedIds.length === users.length
                                        }
                                        onChange={selectAll}
                                    />
                                </th>
                                <th className="px-3 py-2 text-left">이름</th>
                                <th className="px-3 py-2 text-left">이메일</th>
                                <th className="px-3 py-2 text-center">학년</th>
                                <th className="px-3 py-2 text-center">반</th>
                                <th className="px-3 py-2 text-center">역할</th>
                                <th className="px-3 py-2 text-right">잔액 (C)</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.map((u) => {
                                const checked = selectedIds.includes(u.id);
                                return (
                                    <tr
                                        key={u.id}
                                        className={`border-t border-slate-800 ${
                                            checked ? "bg-slate-800/60" : ""
                                        }`}
                                    >
                                        <td className="px-2 py-1.5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleSelect(u.id)}
                                            />
                                        </td>
                                        <td className="px-3 py-1.5">
                                            {u.name ?? "(이름 없음)"}
                                        </td>
                                        <td className="px-3 py-1.5 font-mono">{u.email}</td>
                                        <td className="px-3 py-1.5 text-center">
                                            {u.grade ?? "-"}
                                        </td>
                                        <td className="px-3 py-1.5 text-center">
                                            {u.classRoom ?? "-"}
                                        </td>
                                        <td className="px-3 py-1.5 text-center">
                                            {u.classRole ?? u.role}
                                        </td>
                                        <td className="px-3 py-1.5 text-right">
                                            {u.balance.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {msg && <p className="text-xs text-emerald-400">{msg}</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}
        </section>
    );
}
