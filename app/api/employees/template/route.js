import { NextResponse } from "next/server";
import { createTemplateWorkbook } from "@/generateTemplate";

export async function GET() {
  try {
    const workbook = await createTemplateWorkbook();
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="Employee_Import_Template.xlsx"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Template dynamic generation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
