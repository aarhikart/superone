import { ADMIN_ROLES } from "@/lib/admin-access";
import { requireApiRole } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";
import ManualCelebration from "@/models/ManualCelebration";
import mongoose from "mongoose";

export async function POST(req) {
  const { error } = await requireApiRole([
    ADMIN_ROLES.ADMIN,
    ADMIN_ROLES.HR,
  ]);

  if (error) {
    return error;
  }

  try {
    const { cardId, employeeId, celebrationType, imageUrl } = await req.json();

    if (!imageUrl || (!employeeId && !cardId)) {
      return Response.json(
        { error: "Image URL and Employee/Card identifier are required." },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if this is a manual celebration card
    if (cardId && cardId.startsWith("manual_")) {
      const manualId = cardId.replace("manual_", "");
      if (mongoose.Types.ObjectId.isValid(manualId)) {
        await ManualCelebration.findByIdAndUpdate(manualId, {
          $set: { assetImageUrl: imageUrl },
        });
        return Response.json({
          success: true,
          message: "Manual celebration image updated successfully.",
          imageUrl,
        });
      }
    }

    // Otherwise, update the registered employee's custom image
    if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
      const updateField = {};
      if (celebrationType === "Birthday") {
        updateField["customImages.birthdayImageUrl"] = imageUrl;
      } else if (celebrationType === "Work Anniversary") {
        updateField["customImages.workAnniversaryImageUrl"] = imageUrl;
      } else if (celebrationType === "Personal Anniversary") {
        updateField["customImages.personalAnniversaryImageUrl"] = imageUrl;
      } else {
        updateField["customImages.birthdayImageUrl"] = imageUrl;
      }

      await Employee.findByIdAndUpdate(employeeId, {
        $set: updateField,
      });

      return Response.json({
        success: true,
        message: "Employee celebration image updated and saved permanently.",
        imageUrl,
      });
    }

    return Response.json(
      { error: "Invalid employee or card identifier." },
      { status: 400 }
    );
  } catch (err) {
    return Response.json(
      { error: err.message || "Failed to update celebration card image." },
      { status: 500 }
    );
  }
}
