// app/api/auth/[...nextauth]/route.ts

// ✅ Prisma + NextAuth는 Edge에서 못 돌아가니까 Node 런타임 강제
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { handlers } from "@/auth";

// NextAuth 핸들러 그대로 노출
export const GET = handlers.GET;
export const POST = handlers.POST;
