// app/admin/AdminInquiries.tsx
import { prisma } from "@/lib/prisma";
import AdminInquiriesClient from "./AdminInquiriesClient";

export default async function AdminInquiries() {
    const inquiries = await prisma.inquiry.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            sender: true,
        },
    });

    const safe = inquiries.map((inq) => ({
        id: inq.id,
        message: inq.message,
        createdAt: inq.createdAt.toISOString(),
        replyMessage: inq.replyMessage ?? null,
        repliedAt: inq.repliedAt ? inq.repliedAt.toISOString() : null,
        repliedByEmail: inq.repliedByEmail ?? null,
        sender: {
            name: inq.sender.name,
            email: inq.sender.email,
            grade: inq.sender.grade,
            classRoom: inq.sender.classRoom,
        },
    }));

    return <AdminInquiriesClient inquiries={safe} />;
}
