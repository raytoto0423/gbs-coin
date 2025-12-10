// app/admin/AdminInquiries.tsx
import { prisma } from "@/lib/prisma";

export default async function AdminInquiries() {
    const inquiries = await prisma.inquiry.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
            sender: true,
        },
    });

    if (inquiries.length === 0) {
        return (
            <section className="mt-8 p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-2">문의 내역</h2>
                <p className="text-sm text-gray-600">
                    아직 접수된 문의가 없습니다.
                </p>
            </section>
        );
    }

    return (
        <section className="mt-8 p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">최근 문의 내역</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {inquiries.map((inq) => (
                    <div
                        key={inq.id}
                        className="border rounded-md p-3 text-sm bg-gray-50"
                    >
                        <div className="flex justify-between items-center mb-1">
                            <div>
                                <p className="font-medium text-gray-900">
                                    {inq.sender.name ?? inq.sender.email}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {inq.sender.email}
                                </p>
                            </div>
                            <p className="text-xs text-gray-500">
                                {new Date(inq.createdAt).toLocaleString(
                                    "ko-KR"
                                )}
                            </p>
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap">
                            {inq.message}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
