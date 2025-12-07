// auth.ts (프로젝트 루트)

// NextAuth v5 스타일
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";

const SCHOOL_EMAIL_REGEX =
    /^gbs\.(s|t)(\d{2})(\d{4})@ggh\.goe\.go\.kr$/i;

const ADMIN_EMAIL = "dhhwang423@gmail.com";

// ✅ next-auth 타입 확장 (jwt 모듈 건드리지 않음)
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string | null;
            role: string;
            boothId?: string | null;
        };
    }

    interface User {
        id: string;
        email: string;
        name: string | null;
        role: string;
        boothId?: string | null;
    }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    providers: [
        // 1) 구글 로그인 (학생/선생님/관리자)
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        // 2) 부스 로그인 (부스 ID + 비밀번호)
        Credentials({
            id: "booth-login",
            name: "Booth Login",
            credentials: {
                boothId: { label: "부스 ID", type: "text" },
                password: { label: "비밀번호", type: "password" },
            },
            async authorize(credentials) {
                // 🔥 여기서 타입을 확실히 string으로 캐스팅
                const boothId = credentials?.boothId as string | undefined;
                const password = credentials?.password as string | undefined;

                if (!boothId || !password) return null;

                const booth = await prisma.booth.findUnique({
                    where: { id: boothId },
                });
                if (!booth) return null;

                const bcrypt = await import("bcryptjs");
                const ok = await bcrypt.compare(password, booth.passwordHash);
                if (!ok) return null;

                return {
                    id: booth.id,
                    email: `${booth.id}@booth.local`,
                    name: booth.name,
                    role: "BOOTH",
                    boothId: booth.id,
                };
            },
        }),

        // 3) (옵션) 개발용 유저 로그인 – 필요 없으면 이 블록 전체 삭제해도 됨
        Credentials({
            id: "dev-user",
            name: "Dev User Login",
            credentials: {
                email: { label: "이메일(임의)", type: "text" },
                role: { label: "역할(STUDENT/TEACHER/ADMIN)", type: "text" },
            },
            async authorize(credentials) {
                const email = credentials?.email as string | undefined;
                const roleInput = (credentials?.role as string | undefined)?.toUpperCase() ?? "";

                if (!email) return null;

                const role =
                    roleInput === "TEACHER"
                        ? "TEACHER"
                        : roleInput === "ADMIN"
                            ? "ADMIN"
                            : "STUDENT";

                const user = await prisma.user.upsert({
                    where: { email },
                    update: { role },
                    create: {
                        email,
                        name: email,
                        role,
                    },
                });

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],

    pages: {
        signIn: "/login/user",
    },

    session: {
        strategy: "jwt",
    },

    callbacks: {
        // ✅ 구글 로그인 시 이메일/역할 검증 + DB upsert
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const email = user.email ?? "";

                // 관리자
                if (email === ADMIN_EMAIL) {
                    await prisma.user.upsert({
                        where: { email },
                        update: { name: user.name ?? "관리자", role: "ADMIN" },
                        create: {
                            email,
                            name: user.name ?? "관리자",
                            role: "ADMIN",
                        },
                    });
                    return true;
                }

                // 학교 이메일만 허용
                const match = email.match(SCHOOL_EMAIL_REGEX);
                if (!match) return false;

                const kind = match[1].toLowerCase(); // s/t
                const role = kind === "s" ? "STUDENT" : "TEACHER";

                await prisma.user.upsert({
                    where: { email },
                    update: { name: user.name ?? "", role },
                    create: {
                        email,
                        name: user.name ?? "",
                        role,
                    },
                });

                return true;
            }

            // 부스/개발용 로그인은 여기서 따로 막지 않음
            return true;
        },

        // ✅ JWT에 우리가 쓸 값 저장 (타입은 any로 넉넉하게)
        async jwt({ token, user, account }) {
            const t: any = token;

            if (user && account) {
                if (account.provider === "google" || account.provider === "dev-user") {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: user.email! },
                    });

                    if (dbUser) {
                        t.userId = dbUser.id;
                        t.role = dbUser.role;
                        t.boothId = null;
                    }
                } else if (account.provider === "booth-login") {
                    t.userId = (user as any).id;
                    t.role = "BOOTH";
                    t.boothId = (user as any).boothId ?? (user as any).id;
                }
            }

            return t;
        },

        // ✅ 세션에 우리가 쓸 user 정보 세팅
        async session({ session, token }) {
            const t: any = token;

            if (session.user) {
                session.user.id = t.userId ?? "";
                session.user.email = session.user.email ?? "";
                session.user.name = session.user.name ?? "";
                session.user.role = t.role ?? "";
                session.user.boothId = t.boothId ?? null;
            }

            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
});
