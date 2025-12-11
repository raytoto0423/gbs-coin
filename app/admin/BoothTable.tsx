// app/admin/BoothTable.tsx
"use client";

import React, { useState } from "react";

type Activity = {
    id: string;
    title: string;
    price: number;
    type: string;
    isActive: boolean;
};

type BoothWithActivities = {
    id: string;
    name: string;
    grade: number | null;
    classRoom: number | null;
    balance: number;
    passwordPlain: string | null;
    activities: Activity[];
};

export default function BoothTable({ booths }: { booths: BoothWithActivities[] }) {
    const [openBoothIds, setOpenBoothIds] = useState<Set<string>>(new Set());

    const toggleBooth = (id: string) => {
        setOpenBoothIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/60">
            <table className="min-w-full text-xs">
                <thead>
                <tr className="bg-slate-800/80">
                    <th className="w-8 px-2 py-2" />
                    <th className="px-3 py-2 text-left">부스 ID</th>
                    <th className="px-3 py-2 text-left">이름</th>
                    <th className="px-3 py-2 text-center">학년</th>
                    <th className="px-3 py-2 text-center">반</th>
                    <th className="px-3 py-2 text-right">잔액 (C)</th>
                    <th className="px-3 py-2 text-left">비밀번호</th>
                </tr>
                </thead>
                <tbody>
                {booths.map((b) => {
                    const isOpen = openBoothIds.has(b.id);
                    const activities = b.activities ?? [];

                    return (
                        <React.Fragment key={b.id}>
                            {/* 기본 부스 행 */}
                            <tr className="border-t border-slate-800 hover:bg-slate-800/40">
                                <td className="px-2 py-1.5 align-top">
                                    <button
                                        type="button"
                                        onClick={() => toggleBooth(b.id)}
                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-500 text-[10px] hover:bg-slate-700"
                                        aria-label={
                                            isOpen
                                                ? "상품 정보 접기"
                                                : "상품 정보 펼치기"
                                        }
                                    >
                                        {isOpen ? "▾" : "▸"}
                                    </button>
                                </td>
                                <td className="px-3 py-1.5 font-mono align-top">
                                    {b.id}
                                </td>
                                <td className="px-3 py-1.5 align-top">
                                    {b.name}
                                </td>
                                <td className="px-3 py-1.5 text-center align-top">
                                    {b.grade ?? "-"}
                                </td>
                                <td className="px-3 py-1.5 text-center align-top">
                                    {b.classRoom ?? "-"}
                                </td>
                                <td className="px-3 py-1.5 text-right align-top">
                                    {b.balance.toLocaleString()}
                                </td>
                                <td className="px-3 py-1.5 font-mono align-top">
                                    {b.passwordPlain ?? "(미설정)"}
                                </td>
                            </tr>

                            {/* 펼쳐지는 Activity(상품) 정보 */}
                            {isOpen && (
                                <tr className="border-t border-slate-800 bg-slate-950/70">
                                    <td colSpan={7} className="px-6 py-3">
                                        <div className="space-y-2">
                                            <p className="text-[11px] text-slate-300 font-semibold">
                                                등록된 활동 / 상품 목록
                                            </p>

                                            {activities.length === 0 ? (
                                                <p className="text-[11px] text-slate-500">
                                                    이 부스에 등록된 활동(상품)이 없습니다.
                                                </p>
                                            ) : (
                                                <div className="overflow-x-auto rounded-md border border-slate-700 bg-slate-900/80">
                                                    <table className="min-w-full text-[11px]">
                                                        <thead>
                                                        <tr className="bg-slate-800/80">
                                                            <th className="px-3 py-1 text-left">
                                                                제목
                                                            </th>
                                                            <th className="px-3 py-1 text-right">
                                                                가격 (C)
                                                            </th>
                                                            <th className="px-3 py-1 text-center">
                                                                타입
                                                            </th>
                                                            <th className="px-3 py-1 text-center">
                                                                사용 여부
                                                            </th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        {activities.map((a) => (
                                                            <tr
                                                                key={a.id}
                                                                className="border-t border-slate-800"
                                                            >
                                                                <td className="px-3 py-1">
                                                                    {a.title}
                                                                </td>
                                                                <td className="px-3 py-1 text-right">
                                                                    {a.price.toLocaleString()}
                                                                </td>
                                                                <td className="px-3 py-1 text-center">
                                                                    {a.type}
                                                                </td>
                                                                <td className="px-3 py-1 text-center">
                                                                    {a.isActive ? "활성" : "비활성"}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}
