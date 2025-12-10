// auth.ts (프로젝트 루트 기준)

// NextAuth v5 스타일
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";

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

            grade?: number | null;
            classRoom?: number | null;
            classRole?: string | null; // "학생" | "회장" | "부회장"
        };
    }

    interface User {
        id: string;
        email: string;
        name: string | null;
        role: string;
        boothId?: string | null;

        grade?: number | null;
        classRoom?: number | null;
        classRole?: string | null;
    }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    trustHost: true,

    providers: [
        // 1) 구글 로그인 (학생/선생님/관리자)
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // PKCE 문제 방지용
            checks: ["none"],
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

                if (!boothId || !password) {
                    console.log("[booth-login] boothId 또는 password 없음");
                    return null;
                }

                const booth = await prisma.booth.findUnique({
                    where: { id: boothId },
                });

                if (!booth) {
                    console.log("[booth-login] 해당 부스를 찾을 수 없음");
                    return null;
                }

                const bcrypt = await import("bcryptjs");

                let ok = false;

                try {
                    // 1) bcrypt 해시 비교
                    ok = await bcrypt.compare(password, booth.passwordHash);
                } catch (e) {
                    console.error("[booth-login] bcrypt.compare 에러", e);
                }

                // 2) 혹시 DB에 평문 1234가 들어있다면 이것도 임시 허용
                if (!ok && booth.passwordPlain && password === booth.passwordPlain) {
                    console.log("[booth-login] 평문 비밀번호가 DB 값과 일치 (임시 허용)");
                    ok = true;
                }

                if (!ok) {
                    console.log("[booth-login] 비밀번호 불일치: 입력 =", password, " / DB =", booth.passwordPlain);
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

        // 3) (옵션) 개발용 유저 로그인 – 필요 없으면 이 블록 삭제해도 됨
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
        /**
         * 🔐 signIn: "CSV에 있는 학생만" 구글 로그인 허용
         */
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const email = user.email ?? "";

                // 1) 관리자 이메일은 특별 취급 (DB에 없으면 만들어줌)
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

                // 2) 나머지는 CSV 기반으로 seed된 User만 허용
                const dbUser = await prisma.user.findUnique({
                    where: { email },
                });

                if (!dbUser) {
                    // CSV/seed에 없는 이메일 → 로그인 거부
                    return false;
                }

                // 학생/선생/회장/부회장 등은 이미 seed에서 role/grade/classRoom/classRole 입력됨
                return true;
            }

            // 부스/개발용 로그인은 여기서 막지 않음
            return true;
        },

        /**
         * 🧠 jwt: DB의 학년/반/역할 정보를 JWT에 넣기
         */
        async jwt({ token, user, account }) {
            const t: any = token;

            if (user && account) {
                // 구글 로그인 또는 dev-user 로그인
                if (account.provider === "google" || account.provider === "dev-user") {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: user.email! },
                        select: {
                            id: true,
                            role: true,
                            grade: true,
                            classRoom: true,
                            classRole: true,
                        },
                    });

                    if (dbUser) {
                        t.userId = dbUser.id;
                        t.role = dbUser.role;
                        t.grade = dbUser.grade;
                        t.classRoom = dbUser.classRoom;
                        t.classRole = dbUser.classRole;
                        t.boothId = null;
                    }
                } else if (account.provider === "booth-login") {
                    // 부스 로그인
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

        /**
         * 📦 session: JWT에 넣어둔 정보를 프론트에서 쓸 수 있게 세션에 복사
         */
        async session({ session, token }) {
            const t: any = token;

            if (session.user) {
                session.user.id = t.userId ?? "";
                session.user.email = session.user.email ?? "";
                session.user.name = session.user.name ?? "";
                session.user.role = t.role ?? "";
                session.user.boothId = t.boothId ?? null;

                // 🔥 여기서 학년/반/학급 역할 정보도 세션에 실어줌
                session.user.grade = t.grade ?? null;
                session.user.classRoom = t.classRoom ?? null;
                session.user.classRole = t.classRole ?? null;
            }

            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
});
