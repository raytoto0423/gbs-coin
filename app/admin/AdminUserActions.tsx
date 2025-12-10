// app/admin/AdminUserActions.tsx
"use client";

import { useState } from "react";

type BulkMode = "SET" | "ADD" | "CLEAR";

type UserLite = {
    id: string;
    name: string;
    email: string;
    role: string;
    grade: number | null;
    classRoom: number | null;
    classRole: string | null;
    balance: number;
};

export default function AdminUserActions() {
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserLite[]>([]);
    const [selected, setSelected] = useState<Record<string, UserLite>>({});
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<BulkMode>("ADD");
    const [amount, setAmount] = useState<number | "">("");
    const [msg, setMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const selectedList = Object.values(selected);

    const onSearch = async () => {
        setLoading(true);
        setMsg(null);
        setError(null);
        try {
            const res = await fetch(
                `/api/admin/search-users?q=${encodeURIComponent(query)}`,
                {
                    method: "GET",
                }
            );
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "검색 요청 실패");
            }
            const data = (await res.json()) as { users: UserLite[] };
            setSearchResults(data.users || []);
        } catch (e: any) {
            setError(e.message || "검색 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (user: UserLite) => {
        setSelected((prev) => {
            const copy = { ...prev };
            if (copy[user.id]) {
                delete copy[user.id];
            } else {
                copy[user.id] = user;
            }
            return copy;
        });
    };

    const clearSelected = () => {
        setSelected({});
    };

    const applyBulk = async () => {
        setLoading(true);
        setMsg(null);
        setError(null);
        try {
            if (selectedList.length === 0) {
                throw new Error("선택된 유저가 없습니다.");
            }

            const body: any = {
                userIds: selectedList.map((u) => u.id),
                mode,
            };

            if (mode === "SET" || mode === "ADD") {
                if (amount === "" || isNaN(Number(amount))) {
                    throw new Error("금액을 숫자로 입력해 주세요.");
                }
                body.amount = Number(amount);
            }

            const res = await fetch("/api/admin/bulk-users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || data.message || "요청 실패");
            }

            setMsg(
                `총 ${selectedList.length}명에게 적용 완료. (mode: ${mode}${
                    body.amount != null ? `, amount: ${body.amount}` : ""
                })`
            );

            // 검색 결과/선택 목록의 잔액도 갱신해줌
            if (Array.isArray(data.users)) {
                const mapById: Record<string, number> = {};
                for (const u of data.users as { id: string; balance: number }[]) {
                    mapById[u.id] = u.balance;
                }

                setSearchResults((prev) =>
                    prev.map((u) =>
                        mapById[u.id] != null ? { ...u, balance: mapById[u.id] } : u
                    )
                );
                setSelected((prev) => {
                    const copy: Record<string, UserLite> = {};
                    for (const u of Object.values(prev)) {
                        if (mapById[u.id] != null) {
                            copy[u.id] = { ...u, balance: mapById[u.id] };
                        } else {
                            copy[u.id] = u;
                        }
                    }
                    return copy;
                });
            }
        } catch (e: any) {
            setError(e.message || "일괄 적용 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-50">
                유저 잔액 관리 (이름 검색 → 대상 목록 → 일괄 적용)
            </h2>

            {/* 검색 영역 */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                    className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-gray-50 outline-none focus:border-emerald-400"
                    placeholder="이름 세 글자 또는 이메일 일부로 검색"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onSearch();
                    }}
                />
                <button
                    type="button"
                    onClick={onSearch}
                    disabled={loading}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-900"
                >
                    검색
                </button>
            </div>

            {/* 검색 결과 */}
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 space-y-2">
                <p className="text-xs text-slate-400 mb-1">
                    검색 결과에서 체크하면 아래 &quot;선택된 대상&quot;에 추가됩니다.
                </p>
                <div className="max-h-64 overflow-y-auto">
                    <table className="min-w-full text-[11px]">
                        <thead>
                        <tr className="bg-slate-800/80">
                            <th className="px-2 py-1 text-center">선택</th>
                            <th className="px-2 py-1 text-left">이름</th>
                            <th className="px-2 py-1 text-left">이메일</th>
                            <th className="px-2 py-1 text-center">학년</th>
                            <th className="px-2 py-1 text-center">반</th>
                            <th className="px-2 py-1 text-right">잔액</th>
                        </tr>
                        </thead>
                        <tbody>
                        {searchResults.map((u) => {
                            const checked = !!selected[u.id];
                            return (
                                <tr
                                    key={u.id}
                                    className="border-t border-slate-800"
                                >
                                    <td className="px-2 py-1 text-center">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleSelect(u)}
                                        />
                                    </td>
                                    <td className="px-2 py-1">
                                        {u.name}
                                        {u.classRole === "회장" && (
                                            <span className="ml-1 text-[9px] text-amber-300">
                          (회장)
                        </span>
                                        )}
                                        {u.classRole === "부회장" && (
                                            <span className="ml-1 text-[9px] text-sky-300">
                          (부회장)
                        </span>
                                        )}
                                    </td>
                                    <td className="px-2 py-1">{u.email}</td>
                                    <td className="px-2 py-1 text-center">
                                        {u.grade ?? "-"}
                                    </td>
                                    <td className="px-2 py-1 text-center">
                                        {u.classRoom ?? "-"}
                                    </td>
                                    <td className="px-2 py-1 text-right">
                                        {u.balance.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                        {searchResults.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-2 py-3 text-center text-slate-500"
                                >
                                    검색 결과가 없습니다.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 선택된 대상 + 일괄 적용 폼 */}
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-300">
                        선택된 대상:{" "}
                        <span className="font-semibold">
              {selectedList.length}명
            </span>
                    </p>
                    <button
                        type="button"
                        onClick={clearSelected}
                        className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                    >
                        선택 목록 초기화
                    </button>
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-800 rounded-md">
                    {selectedList.length === 0 ? (
                        <p className="px-2 py-2 text-[11px] text-slate-500">
                            선택된 사용자가 없습니다.
                        </p>
                    ) : (
                        <ul className="text-[11px]">
                            {selectedList.map((u) => (
                                <li
                                    key={u.id}
                                    className="flex justify-between px-2 py-1 border-b border-slate-800"
                                >
                  <span>
                    {u.name} ({u.email}){" "}
                      {u.grade && u.classRoom
                          ? ` / ${u.grade}-${u.classRoom}`
                          : ""}
                      {u.classRole
                          ? ` / ${u.classRole}`
                          : ""}
                  </span>
                                    <span>{u.balance.toLocaleString()} C</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div>
                        <label className="block text-xs text-gray-300 mb-1">
                            모드
                        </label>
                        <select
                            value={mode}
                            onChange={(e) =>
                                setMode(e.target.value as BulkMode)
                            }
                            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-gray-50 outline-none focus:border-emerald-400"
                        >
                            <option value="ADD">ADD (기존 잔액에 더하기)</option>
                            <option value="SET">SET (잔액을 이 값으로 설정)</option>
                            <option value="CLEAR">CLEAR (0으로 초기화)</option>
                        </select>
                    </div>

                    {(mode === "SET" || mode === "ADD") && (
                        <div>
                            <label className="block text-xs text-gray-300 mb-1">
                                금액
                            </label>
                            <input
                                type="number"
                                className="w-24 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-gray-50 outline-none focus:border-emerald-400"
                                value={amount}
                                onChange={(e) =>
                                    setAmount(
                                        e.target.value === "" ? "" : Number(e.target.value)
                                    )
                                }
                            />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={applyBulk}
                        disabled={loading}
                        className="sm:ml-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:bg-emerald-900"
                    >
                        선택된 유저들에게 적용
                    </button>
                </div>

                {msg && (
                    <p className="text-xs text-emerald-400 whitespace-pre-line">
                        {msg}
                    </p>
                )}
                {error && (
                    <p className="text-xs text-red-400 whitespace-pre-line">
                        {error}
                    </p>
                )}
            </div>
        </section>
    );
}
