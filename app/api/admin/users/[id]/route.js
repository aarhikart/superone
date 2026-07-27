import { ADMIN_ROLES } from "@/lib/admin-access";
import { getCurrentUser, hashPassword, requireApiRole } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";

export async function PUT(req, context) {
  const { error } = await requireApiRole([ADMIN_ROLES.ADMIN]);

  if (error) {
    return error;
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const username =
      typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const role = typeof body?.role === "string" ? body.role : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!username || !Object.values(ADMIN_ROLES).includes(role)) {
      return Response.json({ error: "Username and role are required." }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email format." }, { status: 400 });
    }

    await connectDB();
    const userToUpdate = await AdminUser.findById(id);

    if (!userToUpdate) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    const conflictingUser = await AdminUser.findOne({ username, _id: { $ne: id } });

    if (conflictingUser) {
      return Response.json({ error: "Username already exists." }, { status: 409 });
    }

    if (email) {
      const conflictingEmail = await AdminUser.findOne({ email, _id: { $ne: id } });
      if (conflictingEmail) {
        return Response.json({ error: "Email is already in use by another user." }, { status: 400 });
      }
    }

    if (userToUpdate.role === ADMIN_ROLES.ADMIN && role !== ADMIN_ROLES.ADMIN) {
      const adminCount = await AdminUser.countDocuments({ role: ADMIN_ROLES.ADMIN });

      if (adminCount <= 1) {
        return Response.json(
          { error: "At least one admin account must remain available." },
          { status: 400 }
        );
      }
    }

    userToUpdate.username = username;
    userToUpdate.role = role;
    userToUpdate.email = email;

    if (password.trim()) {
      userToUpdate.passwordHash = hashPassword(password);
    }

    await userToUpdate.save();

    return Response.json({
      user: {
        id: userToUpdate._id.toString(),
        username: userToUpdate.username,
        role: userToUpdate.role,
        email: userToUpdate.email || "",
        lastLoginAt: userToUpdate.lastLoginAt,
      },
    });
  } catch {
    return Response.json({ error: "Unable to update user." }, { status: 500 });
  }
}

export async function DELETE(_req, context) {
  const { error } = await requireApiRole([ADMIN_ROLES.ADMIN]);

  if (error) {
    return error;
  }

  try {
    const { id } = await context.params;
    const currentUser = await getCurrentUser();

    await connectDB();
    const userToDelete = await AdminUser.findById(id);

    if (!userToDelete) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    if (currentUser?.id === id) {
      return Response.json({ error: "You cannot delete your current account." }, { status: 400 });
    }

    if (userToDelete.role === ADMIN_ROLES.ADMIN) {
      const adminCount = await AdminUser.countDocuments({ role: ADMIN_ROLES.ADMIN });

      if (adminCount <= 1) {
        return Response.json(
          { error: "At least one admin account must remain available." },
          { status: 400 }
        );
      }
    }

    await AdminUser.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Unable to delete user." }, { status: 500 });
  }
}
