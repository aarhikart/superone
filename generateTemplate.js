import ExcelJS from "exceljs";
import path from "path";

export async function createTemplateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Employees");

  // Define Headers with proper asterisks for required fields
  sheet.columns = [
    { header: "First Name*", key: "firstName", width: 20 },
    { header: "Last Name*", key: "lastName", width: 20 },
    { header: "Employee ID*", key: "employeeId", width: 16 },
    { header: "Email Address*", key: "email", width: 32 },
    { header: "Phone Number*", key: "phoneNumber", width: 20 },
    { header: "Department*", key: "department", width: 22 },
    { header: "Job Title*", key: "jobTitle", width: 26 },
    { header: "Employment Status*", key: "employmentStatus", width: 22 },
    { header: "Date of Joining* (YYYY-MM-DD)", key: "dateOfJoining", width: 28 },
    { header: "Date of Birth* (YYYY-MM-DD)", key: "dateOfBirth", width: 28 },
    { header: "Personal Anniversary (YYYY-MM-DD)", key: "personalAnniversaryDate", width: 32 },
  ];

  // Header Styling
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4318FF" } };
  sheet.getRow(1).height = 28;
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  // 1. ADD 2 DUMMY ROWS IMMEDIATELY AT ROW 2 AND ROW 3
  const dummyRow1 = sheet.addRow({
    firstName: "John",
    lastName: "Doe",
    employeeId: "EMP-001",
    email: "john.doe@example.com",
    phoneNumber: "+91 98765 43210",
    department: "Engineering",
    jobTitle: "Senior Software Engineer",
    employmentStatus: "Full-time",
    dateOfJoining: "2021-05-15",
    dateOfBirth: "1992-08-20",
    personalAnniversaryDate: "2023-11-10",
  });
  dummyRow1.height = 22;
  dummyRow1.alignment = { vertical: "middle" };

  const dummyRow2 = sheet.addRow({
    firstName: "Priya",
    lastName: "Sharma",
    employeeId: "EMP-002",
    email: "priya.sharma@example.com",
    phoneNumber: "+91 91234 56789",
    department: "Marketing",
    jobTitle: "Marketing Lead",
    employmentStatus: "Full-time",
    dateOfJoining: "2022-03-01",
    dateOfBirth: "1995-12-14",
    personalAnniversaryDate: "2024-04-25",
  });
  dummyRow2.height = 22;
  dummyRow2.alignment = { vertical: "middle" };

  const departments = [
    "Engineering",
    "Marketing",
    "Design",
    "Sales",
    "HR",
    "Finance",
    "Operations",
    "Customer Support",
    "UI/UX 3",
    "Product",
  ].join(",");

  const employmentStatuses = ["Full-time", "Part-time", "Contract", "Intern"].join(",");

  // 2. Apply Data Validation to rows 2 through 500
  for (let i = 2; i <= 500; i++) {
    // Phone Number validation (Text length minimum 6 characters)
    sheet.getCell(`E${i}`).dataValidation = {
      type: "textLength",
      operator: "greaterThanOrEqual",
      showErrorMessage: true,
      allowBlank: false,
      formulae: [6],
      errorStyle: "error",
      errorTitle: "Invalid Phone Number",
      error: "Phone number is required (minimum 6 digits).",
    };

    // Department dropdown list validation
    sheet.getCell(`F${i}`).dataValidation = {
      type: "list",
      allowBlank: false,
      showErrorMessage: true,
      formulae: [`"${departments}"`],
      errorStyle: "error",
      errorTitle: "Invalid Department",
      error: "Please select a valid Department from the dropdown list.",
    };

    // Job Title validation (Required text length >= 2)
    sheet.getCell(`G${i}`).dataValidation = {
      type: "textLength",
      operator: "greaterThanOrEqual",
      showErrorMessage: true,
      allowBlank: false,
      formulae: [2],
      errorStyle: "error",
      errorTitle: "Invalid Job Title",
      error: "Job Title is required.",
    };

    // Employment Status dropdown list validation
    sheet.getCell(`H${i}`).dataValidation = {
      type: "list",
      allowBlank: false,
      showErrorMessage: true,
      formulae: [`"${employmentStatuses}"`],
      errorStyle: "error",
      errorTitle: "Invalid Employment Status",
      error: "Please select Full-time, Part-time, Contract, or Intern.",
    };

    // Date of Joining validation (Required Date)
    sheet.getCell(`I${i}`).dataValidation = {
      type: "date",
      operator: "lessThan",
      showErrorMessage: true,
      allowBlank: false,
      formulae: [new Date("2099-01-01")],
      errorStyle: "error",
      errorTitle: "Invalid Date of Joining",
      error: "Please enter a valid Date of Joining in YYYY-MM-DD format.",
    };

    // Date of Birth validation (Required Date)
    sheet.getCell(`J${i}`).dataValidation = {
      type: "date",
      operator: "lessThan",
      showErrorMessage: true,
      allowBlank: false,
      formulae: [new Date("2099-01-01")],
      errorStyle: "error",
      errorTitle: "Invalid Date of Birth",
      error: "Please enter a valid Date of Birth in YYYY-MM-DD format.",
    };

    // Personal Anniversary validation (Optional Date)
    sheet.getCell(`K${i}`).dataValidation = {
      type: "date",
      operator: "lessThan",
      showErrorMessage: true,
      allowBlank: true,
      formulae: [new Date("2099-01-01")],
      errorStyle: "error",
      errorTitle: "Invalid Personal Anniversary Date",
      error: "Please enter a valid date in YYYY-MM-DD format or leave blank.",
    };
  }

  return workbook;
}

export async function generateTemplate() {
  const workbook = await createTemplateWorkbook();
  const p = path.join(process.cwd(), "public", "Employee_Import_Template.xlsx");
  await workbook.xlsx.writeFile(p);
  console.log("Template generated successfully at", p);
}

// Automatically execute if run directly via node
if (process.argv[1] && (process.argv[1].endsWith("generateTemplate.js") || process.argv[1].endsWith("generateTemplate"))) {
  generateTemplate().catch(console.error);
}
