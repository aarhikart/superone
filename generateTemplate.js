import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

async function generateTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Employees");

  // Define Headers
  sheet.columns = [
    { header: "First Name*", key: "firstName", width: 20 },
    { header: "Last Name*", key: "lastName", width: 20 },
    { header: "Employee ID*", key: "employeeId", width: 15 },
    { header: "Email Address*", key: "email", width: 30 },
    { header: "Phone Number", key: "phoneNumber", width: 15 },
    { header: "Department", key: "department", width: 20 },
    { header: "Job Title", key: "jobTitle", width: 25 },
    { header: "Employment Status*", key: "employmentStatus", width: 20 },
    { header: "Date of Joining* (YYYY-MM-DD)", key: "dateOfJoining", width: 25 },
    { header: "Date of Birth (YYYY-MM-DD)", key: "dateOfBirth", width: 25 },
    { header: "Personal Anniversary (YYYY-MM-DD)", key: "personalAnniversaryDate", width: 30 },
  ];

  // Header Styling
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4318FF" } };

  // Data Validation for Employment Status
  for (let i = 2; i <= 1000; i++) {
    sheet.getCell(`H${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Full-time,Part-time,Contract,Intern"']
    };

    // Date Validation for Date Fields
    sheet.getCell(`I${i}`).dataValidation = {
      type: 'date',
      operator: 'lessThan',
      showErrorMessage: true,
      allowBlank: false,
      formulae: [new Date('2099-01-01')],
      errorStyle: 'error',
      errorTitle: 'Invalid Date',
      error: 'Please enter a valid date in YYYY-MM-DD format.'
    };
    sheet.getCell(`J${i}`).dataValidation = {
      type: 'date',
      operator: 'lessThan',
      showErrorMessage: true,
      allowBlank: true,
      formulae: [new Date('2099-01-01')],
      errorStyle: 'error',
      errorTitle: 'Invalid Date',
      error: 'Please enter a valid date in YYYY-MM-DD format.'
    };
    sheet.getCell(`K${i}`).dataValidation = {
      type: 'date',
      operator: 'lessThan',
      showErrorMessage: true,
      allowBlank: true,
      formulae: [new Date('2099-01-01')],
      errorStyle: 'error',
      errorTitle: 'Invalid Date',
      error: 'Please enter a valid date in YYYY-MM-DD format.'
    };
  }

  // Add Dummy Data
  sheet.addRow({
    firstName: "John",
    lastName: "Doe",
    employeeId: "EMP-001",
    email: "john.doe@example.com",
    phoneNumber: "+1234567890",
    department: "Engineering",
    jobTitle: "Software Engineer",
    employmentStatus: "Full-time",
    dateOfJoining: new Date("2021-05-15"),
    dateOfBirth: new Date("1990-10-25"),
    personalAnniversaryDate: new Date("2022-01-10"),
  });
  
  sheet.addRow({
    firstName: "Jane",
    lastName: "Smith",
    employeeId: "EMP-002",
    email: "jane.smith@example.com",
    phoneNumber: "+0987654321",
    department: "Marketing",
    jobTitle: "Marketing Manager",
    employmentStatus: "Part-time",
    dateOfJoining: new Date("2023-08-01"),
    dateOfBirth: new Date("1985-02-14"),
    personalAnniversaryDate: "",
  });

  const p = path.join(process.cwd(), "public", "Employee_Import_Template.xlsx");
  await workbook.xlsx.writeFile(p);
  console.log("Template generated at", p);
}

generateTemplate().catch(console.error);
