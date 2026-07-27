import crypto from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth-config";
import { connectDB } from "@/lib/mongodb";
import { canAccessAdminPath } from "@/lib/admin-access";
import { createSessionToken, parseSessionToken } from "@/lib/session-token";
import AdminUser from "@/models/AdminUser";

const DEFAULT_ADMIN = {
  username: "hitesh",
  password: "hak@1720",
  role: "Admin",
};

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, passwordHash) {
  if (!passwordHash || !passwordHash.includes(":")) {
    return false;
  }

  const [salt, storedHash] = passwordHash.split(":");
  const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
  const storedBuffer = Buffer.from(storedHash, "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");

  if (storedBuffer.length !== computedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, computedBuffer);
}

function normalizeUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    email: user.email || "",
    lastLoginAt: user.lastLoginAt || null,
  };
}

export async function ensureDefaultAdminUser() {
  await connectDB();

  const totalUsers = await AdminUser.countDocuments();

  if (totalUsers > 0) {
    return;
  }

  await AdminUser.create({
    username: DEFAULT_ADMIN.username,
    passwordHash: hashPassword(DEFAULT_ADMIN.password),
    role: DEFAULT_ADMIN.role,
    createdBy: "system",
  });
}

export async function findUserByUsername(username) {
  await connectDB();
  await ensureDefaultAdminUser();

  const normalizedUsername =
    typeof username === "string" ? username.trim().toLowerCase() : "";

  if (!normalizedUsername) {
    return null;
  }

  return AdminUser.findOne({ username: normalizedUsername });
}

export async function createSession(user) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const token = createSessionToken({
    userId: user._id.toString(),
    username: user.username,
    role: user.role,
    expiresAt,
  });

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return parseSessionToken(token);
}

export const getCurrentUser = cache(async () => {
  const payload = await getSessionPayload();

  if (!payload?.userId) {
    return null;
  }

  await connectDB();
  const user = await AdminUser.findById(payload.userId);

  if (!user) {
    return null;
  }

  return normalizeUser(user);
});

export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

export async function requireRoleAccess(roles, pathname = "/admin") {
  const user = await requireAdminUser();

  if (!roles.includes(user.role) || !canAccessAdminPath(user.role, pathname)) {
    redirect("/admin");
  }

  return user;
}

export async function requireApiRole(roles) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: Response.json({ error: "Unauthorized." }, { status: 401 }),
      user: null,
    };
  }

  if (!roles.includes(user.role)) {
    return {
      error: Response.json({ error: "Forbidden." }, { status: 403 }),
      user: null,
    };
  }

  return { error: null, user };
}

export async function authenticateUser(username, password) {
  const user = await findUserByUsername(username);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  user.lastLoginAt = new Date();
  await user.save();

  return user;
}

export async function listAdminUsers() {
  await connectDB();
  await ensureDefaultAdminUser();
  const users = await AdminUser.find().sort({ createdAt: -1 });
  return users.map(normalizeUser);
}

export async function getAdminUserById(id) {
  await connectDB();
  const user = await AdminUser.findById(id);
  return user ? normalizeUser(user) : null;
}

export { DEFAULT_ADMIN, SESSION_COOKIE };
