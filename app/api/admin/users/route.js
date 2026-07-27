import { ADMIN_ROLES } from "@/lib/admin-access";
import { hashPassword, listAdminUsers, requireApiRole } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";

export async function GET() {
  const { error } = await requireApiRole([ADMIN_ROLES.ADMIN, ADMIN_ROLES.HR]);

  if (error) {
    return error;
  }

  const users = await listAdminUsers();
  return Response.json({ users });
}

export async function POST(req) {
  const { error, user } = await requireApiRole([ADMIN_ROLES.ADMIN]);

  if (error) {
    return error;
  }

  try {
    const body = await req.json();
    const username =
      typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const role = typeof body?.role === "string" ? body.role : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!username || !password || !Object.values(ADMIN_ROLES).includes(role)) {
      return Response.json({ error: "Username, password, and role are required." }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email format." }, { status: 400 });
    }

    await connectDB();
    const existingUser = await AdminUser.findOne({ username });

    if (existingUser) {
      return Response.json({ error: "Username already exists." }, { status: 409 });
    }

    if (email) {
      const existingEmail = await AdminUser.findOne({ email });
      if (existingEmail) {
        return Response.json({ error: "Email is already in use by another user." }, { status: 400 });
      }
    }

    const createdUser = await AdminUser.create({
      username,
      passwordHash: hashPassword(password),
      role,
      email,
      createdBy: user.username,
    });

    return Response.json(
      {
        user: {
          id: createdUser._id.toString(),
          username: createdUser.username,
          role: createdUser.role,
          email: createdUser.email || "",
          lastLoginAt: createdUser.lastLoginAt,
        },
      },
      { status: 201 }
    );
  } catch {
    return Response.json({ error: "Unable to create user." }, { status: 500 });
  }
}
