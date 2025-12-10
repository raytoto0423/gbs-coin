// auth.ts (프로젝트 루트 기준)

// NextAuth v5 스타일
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";

// auth.ts (일부)

// NextAuth v5 스타일
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";

const SCHOOL_EMAIL_REGEX =
    /^gbs\.(s|t)(\d{2})(\d{4})@ggh\.goe\.go\.kr$/i;

const ADMIN_EMAIL = "dhhwang423@gmail.com";

// ✅ next-auth 타입 확장
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string | null;
            role: string;
            grade?: number | null;
            classRoom?: number | null;
            classRole?: string | null;
            boothId?: string | null;
        };
    }

    interface User {
        id: string;
        email: string;
        name: string | null;
        role: string;
        grade?: number | null;
        classRoom?: number | null;
        classRole?: string | null;
        boothId?: string | null;
    }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    trustHost: true,
    providers: [
        // 1) 구글 로그인 (학생/선생님/관리자)
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            checks: ["none"], // pkce 에러 막으려고 쓰던 설정 유지
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
                const boothId = credentials?.boothId?.toString().trim();
                const password = credentials?.password?.toString() ?? "";

                console.log("[booth-login] 시도 boothId =", boothId);

                if (!boothId || !password) return null;

                const booth = await prisma.booth.findUnique({
                    where: { id: boothId },
                });

                if (!booth) {
                    console.log("[booth-login] 부스 없음");
                    return null;
                }

                const bcrypt = await import("bcryptjs");
                let ok = false;

                try {
                    ok = await bcrypt.compare(password, booth.passwordHash);
                } catch (e) {
                    console.error("[booth-login] bcrypt.compare 에러", e);
                }

                // passwordPlain 이 있을 경우 임시 허용
                if (!ok && booth.passwordPlain && booth.passwordPlain === password) {
                    ok = true;
                }

                if (!ok) {
                    console.log("[booth-login] 비밀번호 불일치");
                    return null;
                }

                console.log("[booth-login] 로그인 성공:", booth.id);

                return {
                    id: booth.id,
                    email: `${booth.id}@booth.local`,
                    name: booth.name,
                    role: "BOOTH",
                    boothId: booth.id,
                };
            },
        }),

        // 3) 개발용 계정 (원래 쓰던 거 그대로)
        Credentials({
            id: "dev-user",
            name: "Dev User Login",
            credentials: {
                email: { label: "이메일(임의)", type: "text" },
                role: { label: "역할(STUDENT/TEACHER/ADMIN)", type: "text" },
            },
            async authorize(credentials) {
                const email = credentials?.email as string | undefined;
                const roleInput =
                    (credentials?.role as string | undefined)?.toUpperCase() ?? "";

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
                    grade: user.grade,
                    classRoom: user.classRoom,
                    classRole: user.classRole,
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
        // ✅ 구글 로그인 시 DB upsert (학년/반/역할은 seed 데이터 사용)
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const email = user.email ?? "";

                // 관리자
                if (email === ADMIN_EMAIL) {
                    await prisma.user.upsert({
                        where: { email },
                        update: {
                            name: user.name ?? "관리자",
                            role: "ADMIN",
                        },
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

                // 📌 grade / classRoom / classRole 은 이미 seed 에 들어있다고 가정 → 여기선 role 위주로만 업데이트
                await prisma.user.upsert({
                    where: { email },
                    update: {
                        name: user.name ?? "",
                        role,
                    },
                    create: {
                        email,
                        name: user.name ?? "",
                        role,
                    },
                });

                return true;
            }

            return true;
        },

        // ✅ JWT에 우리가 쓸 값 저장
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

                        // 🔥 학년/반/학급 역할도 토큰에 저장
                        t.grade = dbUser.grade ?? null;
                        t.classRoom = dbUser.classRoom ?? null;
                        t.classRole = dbUser.classRole ?? null;
                    }
                } else if (account.provider === "booth-login") {
                    t.userId = (user as any).id;
                    t.role = "BOOTH";
                    t.boothId = (user as any).boothId ?? (user as any).id;

                    t.grade = null;
                    t.classRoom = null;
                    t.classRole = null;
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

                // 🔥 학년/반/학급 역할 세션에 넣기
                session.user.grade = t.grade ?? null;
                session.user.classRoom = t.classRoom ?? null;
                session.user.classRole = t.classRole ?? null;
            }

            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
});

