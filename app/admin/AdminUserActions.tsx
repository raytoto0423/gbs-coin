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
    } catch {
        // ignore
    }

    if (!res.ok) {
        throw new Error(data.message || data.error || `요청 실패 (${res.status})`);
    }
    return data;
}

export default function AdminUserActions() {
    // 검색 관련
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<UserItem[]>([]);
    const [searchSelectedIds, setSearchSelectedIds] = useState<string[]>([]);

    // 실제로 잔액을 적용할 "대상 리스트"
    const [targets, setTargets] = useState<UserItem[]>([]);

    // 잔액 조정
    const [mode, setMode] = useState<BulkMode>("ADD");
    const [amount, setAmount] = useState<number | "">("");
    const [loadingApply, setLoadingApply] = useState(false);

    // 메시지
    const [msg, setMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const toggleSearchSelect = (id: string) => {
        setSearchSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSearchSelectAll = () => {
        if (searchSelectedIds.length === results.length) {
            setSearchSelectedIds([]);
        } else {
            setSearchSelectedIds(results.map((u) => u.id));
        }
    };

    const handleSearch = async () => {
        setSearching(true);
        setMsg(null);
        setError(null);
        setSearchSelectedIds([]);

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

            const users: UserItem[] = data.users || [];
            setResults(users);

            if (users.length === 0) {
                setMsg("검색 결과가 없습니다.");
            }
        } catch (e: any) {
            setError(e.message || "검색 중 오류가 발생했습니다.");
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    // 검색 결과에서 체크된 애들을 "대상 리스트"에 추가
    const addSelectedToTargets = () => {
        if (searchSelectedIds.length === 0) {
            setError("검색 결과에서 추가할 유저를 선택해 주세요.");
            return;
        }
        setError(null);
        setMsg(null);

        setTargets((prev) => {
            const existingIds = new Set(prev.map((u) => u.id));
            const toAdd = results.filter(
                (u) => searchSelectedIds.includes(u.id) && !existingIds.has(u.id)
            );
            if (toAdd.length === 0) {
                setMsg("새로 추가된 유저가 없습니다. (이미 대상 목록에 있을 수 있음)");
            } else {
                setMsg(`대상 목록에 ${toAdd.length}명을 추가했습니다.`);
            }
            return [...prev, ...toAdd];
        });

        setSearchSelectedIds([]);
    };

    const removeTarget = (id: string) => {
        setTargets((prev) => prev.filter((u) => u.id !== id));
    };

    const clearTargets = () => {
        setTargets([]);
        setMsg("대상 목록을 비웠습니다.");
    };

    const handleApplyToTargets = async () => {
        setLoadingApply(true);
        setMsg(null);
        setError(null);

        try {
            if (targets.length === 0) {
                throw new Error("대상 목록에 최소 1명 이상 있어야 합니다.");
            }

            const userIds = targets.map((u) => u.id);

            const payload: any = {
                userIds,
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

            // 대상 목록의 잔액 업데이트
            setTargets((prev) =>
                prev.map((u) => {
                    const found = updatedUsers.find((x) => x.id === u.id);
                    return found ? { ...u, balance: found.balance } : u;
                })
            );

            setMsg(
                `선택된 ${targets.length}명에게 잔액이 적용되었습니다. (모드: ${mode})`
            );

            // 리스트 초기화 원하면 여기서 비우기
            setTargets([]);
            setAmount("");
        } catch (e: any) {
            setError(e.message || "잔액 적용 중 오류가 발생했습니다.");
        } finally {
            setLoadingApply(false);
        }
    };

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-50">
                유저 잔액 관리 (이름 검색 → 대상 목록 → 일괄 적용)
            </h2>

            {/* 검색 영역 */}
            <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-4 space-y-2">
                <p className="text-xs text-slate-400">
                    이름으로 검색한 뒤, 검색 결과에서 체크 → &quot;대상 목록에 추가&quot; 버튼으로
                    여러 번 모아 두고, 아래에서 한 번에 잔액을 적용할 수 있습니다.
                </p>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="예: 동현 / 지민 (이름 전체 또는 일부)"
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

            {/* 검색 결과 */}
            {results.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                            검색 결과: {results.length}명
                        </p>
                        <button
                            type="button"
                            onClick={addSelectedToTargets}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                            선택한 {searchSelectedIds.length}명을 대상 목록에 추가
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/60">
                        <table className="min-w-full text-xs">
                            <thead>
                            <tr className="bg-slate-800/80">
                                <th className="px-2 py-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={
                                            results.length > 0 &&
                                            searchSelectedIds.length === results.length
                                        }
                                        onChange={toggleSearchSelectAll}
                                    />
                                </th>
                                <th className="px-3 py-2 text-left">이름</th>
                                <th className="px-3 py-2 text-left">이메일</th>
                                <th className="px-3 py-2 text-center">학년</th>
                                <th className="px-3 py-2 text-center">반</th>
                                <th className="px-3 py-2 text-center">역할</th>
                                <th className="px-3 py-2 text-right">현재 잔액 (C)</th>
                            </tr>
                            </thead>
                            <tbody>
                            {results.map((u) => {
                                const checked = searchSelectedIds.includes(u.id);
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
                                                onChange={() => toggleSearchSelect(u.id)}
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

            {/* 대상 목록 + 잔액 일괄 적용 */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-50">
                        대상 목록 ({targets.length}명)
                    </h3>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={clearTargets}
                            disabled={targets.length === 0}
                            className="rounded-md border border-slate-600 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                        >
                            대상 목록 비우기
                        </button>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div>
                            <label className="block text-xs text-slate-300 mb-1">모드</label>
                            <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value as BulkMode)}
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
                            disabled={loadingApply || targets.length === 0}
                            onClick={handleApplyToTargets}
                            className="sm:ml-2 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:bg-emerald-900"
                        >
                            {loadingApply
                                ? "적용 중..."
                                : `대상 ${targets.length}명에게 잔액 적용`}
                        </button>
                    </div>

                    {targets.length > 0 && (
                        <div className="max-h-52 overflow-y-auto rounded-md border border-slate-700 bg-slate-950/40 mt-2">
                            <table className="min-w-full text-[11px]">
                                <thead>
                                <tr className="bg-slate-800/80">
                                    <th className="px-2 py-1 text-left">이름</th>
                                    <th className="px-2 py-1 text-left">이메일</th>
                                    <th className="px-2 py-1 text-center">학년</th>
                                    <th className="px-2 py-1 text-center">반</th>
                                    <th className="px-2 py-1 text-right">현재 잔액</th>
                                    <th className="px-2 py-1 text-center">제거</th>
                                </tr>
                                </thead>
                                <tbody>
                                {targets.map((u) => (
                                    <tr key={u.id} className="border-t border-slate-800">
                                        <td className="px-2 py-1">{u.name}</td>
                                        <td className="px-2 py-1 font-mono">{u.email}</td>
                                        <td className="px-2 py-1 text-center">
                                            {u.grade ?? "-"}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            {u.classRoom ?? "-"}
                                        </td>
                                        <td className="px-2 py-1 text-right">
                                            {u.balance.toLocaleString()}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeTarget(u.id)}
                                                className="rounded bg-slate-700 px-2 py-0.5 text-[10px] hover:bg-slate-600"
                                            >
                                                X
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {targets.length === 0 && (
                        <p className="text-[11px] text-slate-500">
                            대상 목록이 비어 있습니다. 위에서 검색 후 체크 → &quot;대상 목록에 추가&quot;를
                            눌러 주세요.
                        </p>
                    )}
                </div>
            </div>

            {msg && <p className="text-xs text-emerald-400 mt-1">{msg}</p>}
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </section>
    );
}
