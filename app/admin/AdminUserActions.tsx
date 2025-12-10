"use client";

import { useState } from "react";

type UserItem = {
    id: string;
    name: string;
    email: string;
    grade: number | null;
    classRoom: number | null;
    balance: number;
};

type BulkMode = "SET" | "ADD" | "CLEAR";

export default function AdminUserActions() {
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserItem[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserItem[]>([]);
    const [mode, setMode] = useState<BulkMode>("ADD");
    const [amount, setAmount] = useState<number>(0);
    const [gradeForBulk, setGradeForBulk] = useState<number>(1);
    const [gradeForClass, setGradeForClass] = useState<number>(1);
    const [classForBulk, setClassForBulk] = useState<number>(1);
    const [isApplying, setIsApplying] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);

    // 중복 없이 users 추가
    const mergeSelected = (users: UserItem[]) => {
        setSelectedUsers((prev) => {
            const map = new Map<string, UserItem>();
            [...prev, ...users].forEach((u) => map.set(u.id, u));
            return Array.from(map.values());
        });
    };

    const handleSearch = async () => {
        const q = query.trim();
        if (!q) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch("/api/admin/search-users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: q }),
            });

            if (!res.ok) {
                alert("검색 중 오류가 발생했습니다.");
                return;
            }
            const data = await res.json();
            setSearchResults(data.users ?? []);
        } catch (e) {
            console.error(e);
            alert("검색 중 오류가 발생했습니다.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddSearchResult = (u: UserItem) => {
        mergeSelected([u]);
    };

    const handleRemoveSelected = (id: string) => {
        setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
    };

    const handleClearSelected = () => {
        if (
            selectedUsers.length > 0 &&
            !confirm("선택된 대상 목록을 모두 비우시겠습니까?")
        ) {
            return;
        }
        setSelectedUsers([]);
    };

    // 🔹 전체 / 학년 / 학급 선택
    const handleSelectScope = async (
        scope: "ALL" | "GRADE" | "GRADE_CLASS"
    ) => {
        setIsSelecting(true);
        try {
            const payload: any = { scope };
            if (scope === "GRADE") {
                payload.grade = gradeForBulk;
            } else if (scope === "GRADE_CLASS") {
                payload.grade = gradeForClass;
                payload.classRoom = classForBulk;
            }

            const res = await fetch("/api/admin/select-users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                alert(
                    data?.error ?? "대상 선택 중 오류가 발생했습니다."
                );
                return;
            }

            const data = await res.json();
            const users: UserItem[] = data.users ?? [];
            if (users.length === 0) {
                alert("해당 조건에 해당하는 학생이 없습니다.");
                return;
            }

            mergeSelected(users);
            alert(
                `대상 목록에 ${users.length}명을 추가했습니다. (총 ${selectedUsers.length + users.length
                }명)`
            );
        } catch (e) {
            console.error(e);
            alert("대상 선택 중 오류가 발생했습니다.");
        } finally {
            setIsSelecting(false);
        }
    };

    const handleApply = async () => {
        if (selectedUsers.length === 0) {
            alert("적용할 대상이 없습니다.");
            return;
        }

        if ((mode === "SET" || mode === "ADD") && !Number.isFinite(amount)) {
            alert("금액을 올바르게 입력해주세요.");
            return;
        }

        if (
            !confirm(
                `선택된 ${selectedUsers.length}명에게 ${
                    mode === "CLEAR"
                        ? "잔액을 0으로 초기화"
                        : mode === "SET"
                            ? `잔액을 ${amount} C로 설정`
                            : `${amount} C를 증감`
                } 하시겠습니까?`
            )
        ) {
            return;
        }

        setIsApplying(true);
        try {
            const res = await fetch("/api/admin/bulk-users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userIds: selectedUsers.map((u) => u.id),
                    mode,
                    amount,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data?.error ?? "적용 중 오류가 발생했습니다.");
                return;
            }

            // 응답에 최신 balance가 있으면 갱신
            if (Array.isArray(data.users)) {
                const mapUpdated = new Map<string, number>();
                data.users.forEach((u: any) =>
                    mapUpdated.set(u.id, u.balance ?? 0)
                );
                setSelectedUsers((prev) =>
                    prev.map((u) =>
                        mapUpdated.has(u.id)
                            ? { ...u, balance: mapUpdated.get(u.id)! }
                            : u
                    )
                );
            }

            alert(
                `총 ${data.count ?? selectedUsers.length}명의 잔액을 수정했습니다.`
            );
        } catch (e) {
            console.error(e);
            alert("적용 중 오류가 발생했습니다.");
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-100">
                유저 잔액 관리 (이름 검색 → 대상 목록 → 일괄 적용)
            </h2>

            {/* 🔹 빠른 대상 추가 영역 */}
            <div className="p-4 rounded-lg bg-slate-800 space-y-3 text-sm text-gray-50">
                <p className="font-semibold text-sm">대상 빠르게 추가</p>

                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        type="button"
                        onClick={() => handleSelectScope("ALL")}
                        disabled={isSelecting}
                        className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-xs"
                    >
                        전체 학생 추가
                    </button>

                    {/* 학년 전체 */}
                    <div className="flex items-center gap-1 text-xs">
                        <span>학년 전체:</span>
                        <select
                            value={gradeForBulk}
                            onChange={(e) => setGradeForBulk(Number(e.target.value))}
                            className="border rounded px-1 py-0.5 bg-slate-900 text-xs"
                        >
                            <option value={1}>1학년</option>
                            <option value={2}>2학년</option>
                            <option value={3}>3학년</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => handleSelectScope("GRADE")}
                            disabled={isSelecting}
                            className="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                        >
                            추가
                        </button>
                    </div>

                    {/* 학년+반 전체 */}
                    <div className="flex items-center gap-1 text-xs">
                        <span>학급 전체:</span>
                        <select
                            value={gradeForClass}
                            onChange={(e) => setGradeForClass(Number(e.target.value))}
                            className="border rounded px-1 py-0.5 bg-slate-900 text-xs"
                        >
                            <option value={1}>1학년</option>
                            <option value={2}>2학년</option>
                            <option value={3}>3학년</option>
                        </select>
                        <span> / </span>
                        <select
                            value={classForBulk}
                            onChange={(e) => setClassForBulk(Number(e.target.value))}
                            className="border rounded px-1 py-0.5 bg-slate-900 text-xs"
                        >
                            <option value={1}>1반</option>
                            <option value={2}>2반</option>
                            <option value={3}>3반</option>
                            <option value={4}>4반</option>
                            <option value={5}>5반</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => handleSelectScope("GRADE_CLASS")}
                            disabled={isSelecting}
                            className="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                        >
                            추가
                        </button>
                    </div>
                </div>

                <p className="text-xs text-gray-400">
                    * 관리자 계정과 부스 계정은 자동으로 제외됩니다.
                </p>
            </div>

            {/* 🔹 이름 검색 영역 */}
            <div className="p-4 rounded-lg bg-slate-800 space-y-3 text-sm text-gray-50">
                <p className="font-semibold text-sm">이름 / 이메일 검색</p>
                <div className="flex gap-2">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSearch();
                            }
                        }}
                        placeholder="이름 또는 이메일 일부"
                        className="flex-1 px-2 py-1 rounded-md text-sm bg-slate-900 border border-slate-600 text-gray-50"
                    />
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-xs text-white disabled:opacity-50"
                    >
                        검색
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-700 rounded-md mt-2 bg-slate-900">
                    {searchResults.length === 0 ? (
                        <p className="text-xs text-gray-400 px-2 py-2">
                            검색 결과가 없습니다.
                        </p>
                    ) : (
                        <ul className="text-xs divide-y divide-slate-700">
                            {searchResults.map((u) => (
                                <li
                                    key={u.id}
                                    className="flex items-center justify-between px-2 py-1"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {u.name}{" "}
                                            <span className="text-[10px] text-gray-400">
                        ({u.email})
                      </span>
                                        </p>
                                        <p className="text-[11px] text-gray-400">
                                            {u.grade
                                                ? `${u.grade}학년 ${u.classRoom ?? "?"}반`
                                                : "학급 정보 없음"}
                                            {" · "}
                                            잔액: {u.balance} C
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleAddSearchResult(u)}
                                        className="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-[11px]"
                                    >
                                        추가
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* 🔹 선택된 대상 목록 */}
            <div className="p-4 rounded-lg bg-slate-800 space-y-3 text-sm text-gray-50">
                <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">
                        선택된 대상 ({selectedUsers.length}명)
                    </p>
                    <button
                        type="button"
                        onClick={handleClearSelected}
                        className="px-2 py-1 text-[11px] rounded-md bg-red-600 hover:bg-red-700 text-white"
                    >
                        목록 비우기
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-700 rounded-md bg-slate-900">
                    {selectedUsers.length === 0 ? (
                        <p className="text-xs text-gray-400 px-2 py-2">
                            선택된 대상이 없습니다.
                        </p>
                    ) : (
                        <ul className="text-xs divide-y divide-slate-700">
                            {selectedUsers.map((u) => (
                                <li
                                    key={u.id}
                                    className="flex items-center justify-between px-2 py-1"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {u.name}{" "}
                                            <span className="text-[10px] text-gray-400">
                        ({u.email})
                      </span>
                                        </p>
                                        <p className="text-[11px] text-gray-400">
                                            {u.grade
                                                ? `${u.grade}학년 ${u.classRoom ?? "?"}반`
                                                : "학급 정보 없음"}
                                            {" · "}
                                            잔액: {u.balance} C
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSelected(u.id)}
                                        className="px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-[11px]"
                                    >
                                        제거
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* 🔹 일괄 적용 설정 */}
            <div className="p-4 rounded-lg bg-slate-800 space-y-3 text-sm text-gray-50">
                <p className="font-semibold text-sm">일괄 적용</p>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                    <label className="flex items-center gap-1">
                        <span>모드:</span>
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as BulkMode)}
                            className="border rounded px-2 py-1 bg-slate-900"
                        >
                            <option value="ADD">증감 (ADD)</option>
                            <option value="SET">설정 (SET)</option>
                            <option value="CLEAR">0으로 초기화 (CLEAR)</option>
                        </select>
                    </label>

                    {(mode === "ADD" || mode === "SET") && (
                        <label className="flex items-center gap-1">
                            <span>금액:</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-600"
                            />
                            <span>C</span>
                        </label>
                    )}

                    <button
                        type="button"
                        onClick={handleApply}
                        disabled={isApplying}
                        className="ml-auto px-4 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-xs text-white disabled:opacity-50"
                    >
                        {isApplying ? "적용 중..." : "선택 대상에 적용"}
                    </button>
                </div>

                <p className="text-[11px] text-gray-400">
                    * 관리자 / 부스 계정은 항상 대상에서 제외됩니다.
                </p>
            </div>
        </section>
    );
}
