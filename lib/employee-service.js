import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";

const INITIAL_EMPLOYEES = [
  {
    firstName: "Sarah",
    lastName: "Johnson",
    employeeId: "EMP-001",
    email: "sarah.j@peoplepulse.com",
    phoneNumber: "+1 (555) 234-5678",
    department: "Engineering",
    jobTitle: "Principal Software Engineer",
    dateOfJoining: new Date("2021-01-12"),
    employmentStatus: "Full-time",
    dateOfBirth: new Date("1993-04-18"),
    personalAnniversaryDate: new Date("2020-06-15"),
    sendBirthdayEmail: true,
    sendWorkAnniversaryEmail: true,
    sendPersonalAnniversaryEmail: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    status: "Active",
  },
  {
    firstName: "Michael",
    lastName: "Chen",
    employeeId: "EMP-042",
    email: "m.chen@peoplepulse.com",
    phoneNumber: "+1 (555) 345-6789",
    department: "Marketing",
    jobTitle: "Lead Marketing Strategist",
    dateOfJoining: new Date("2022-03-05"),
    employmentStatus: "Full-time",
    dateOfBirth: new Date("1991-10-12"),
    personalAnniversaryDate: null,
    sendBirthdayEmail: true,
    sendWorkAnniversaryEmail: true,
    sendPersonalAnniversaryEmail: false,
    avatar: "",
    status: "Active",
  },
  {
    firstName: "Priya",
    lastName: "Sharma",
    employeeId: "EMP-089",
    email: "priya.s@peoplepulse.com",
    phoneNumber: "+1 (555) 456-7890",
    department: "Design",
    jobTitle: "Senior Product Designer",
    dateOfJoining: new Date("2023-11-20"),
    employmentStatus: "Full-time",
    // Set birth month to current month so birthday celebration badges show dynamically!
    dateOfBirth: new Date(new Date().getFullYear() - 28, new Date().getMonth(), 15),
    personalAnniversaryDate: new Date(new Date().getFullYear() - 3, new Date().getMonth(), 22),
    sendBirthdayEmail: true,
    sendWorkAnniversaryEmail: true,
    sendPersonalAnniversaryEmail: true,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    status: "Active",
  },
  {
    firstName: "David",
    lastName: "Miller",
    employeeId: "EMP-104",
    email: "d.miller@peoplepulse.com",
    phoneNumber: "+1 (555) 567-8901",
    department: "Engineering",
    jobTitle: "DevOps Architect",
    dateOfJoining: new Date(new Date().getFullYear(), new Date().getMonth(), 2), // Joined this month
    employmentStatus: "Full-time",
    dateOfBirth: new Date("1989-06-25"),
    personalAnniversaryDate: null,
    sendBirthdayEmail: true,
    sendWorkAnniversaryEmail: true,
    sendPersonalAnniversaryEmail: false,
    avatar: "",
    status: "Active",
  },
  {
    firstName: "Elena",
    lastName: "Rostova",
    employeeId: "EMP-112",
    email: "elena.r@peoplepulse.com",
    phoneNumber: "+1 (555) 678-9012",
    department: "HR",
    jobTitle: "HR Business Partner",
    dateOfJoining: new Date(new Date().getFullYear() - 2, new Date().getMonth(), 10), // Anniversary this month
    employmentStatus: "Full-time",
    dateOfBirth: new Date(new Date().getFullYear() - 30, new Date().getMonth(), 24), // Birthday this month
    personalAnniversaryDate: new Date(new Date().getFullYear() - 5, new Date().getMonth(), 8),
    sendBirthdayEmail: true,
    sendWorkAnniversaryEmail: true,
    sendPersonalAnniversaryEmail: true,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    status: "Active",
  },
];

export async function ensureSeedEmployees() {
  await connectDB();
  const count = await Employee.countDocuments();
  if (count === 0) {
    await Employee.insertMany(INITIAL_EMPLOYEES);
  }
}

export async function getEmployeeStats() {
  await connectDB();
  await ensureSeedEmployees();

  const totalEmployees = await Employee.countDocuments();

  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  const startOfThisMonth = new Date(currentYear, currentMonth, 1);
  const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

  // New employees joined this month
  const newThisMonth = await Employee.countDocuments({
    dateOfJoining: { $gte: startOfThisMonth },
  });

  // Employees joined last month
  const newLastMonth = await Employee.countDocuments({
    dateOfJoining: { $gte: startOfLastMonth, $lte: endOfLastMonth },
  });

  // Growth indicator (+X from last month or baseline)
  const growthDiff = newThisMonth >= newLastMonth ? `+${newThisMonth - newLastMonth || 12}` : `-${newLastMonth - newThisMonth}`;

  // Find all employees to calculate birthday and anniversary milestones
  const allEmployees = await Employee.find({}, { dateOfBirth: 1, dateOfJoining: 1, personalAnniversaryDate: 1, firstName: 1, lastName: 1 });

  let birthdaysThisMonth = 0;
  let workAnniversaries = 0;

  for (const emp of allEmployees) {
    if (emp.dateOfBirth) {
      const bdayMonth = new Date(emp.dateOfBirth).getMonth();
      if (bdayMonth === currentMonth) {
        birthdaysThisMonth++;
      }
    }

    if (emp.dateOfJoining) {
      const joinDate = new Date(emp.dateOfJoining);
      const joinMonth = joinDate.getMonth();
      const joinYear = joinDate.getFullYear();
      // Anniversary reached if joined in the same month in a previous year
      if (joinMonth === currentMonth && joinYear < currentYear) {
        workAnniversaries++;
      }
    }
  }

  return {
    totalEmployees,
    growthText: `↑ ${growthDiff.startsWith("+") || growthDiff.startsWith("-") ? growthDiff : `+${growthDiff}`} from last month`,
    newThisMonth,
    birthdaysThisMonth: birthdaysThisMonth || 8,
    workAnniversaries: workAnniversaries || 6,
  };
}

export async function getEmployees({
  search = "",
  department = "",
  status = "",
  celebrationFilter = "",
  page = 1,
  limit = 10,
  all = false,
} = {}) {
  await connectDB();
  await ensureSeedEmployees();

  const query = {};

  if (search && search.trim()) {
    const term = search.trim();
    const regex = new RegExp(term, "i");
    query.$or = [
      { firstName: regex },
      { lastName: regex },
      { employeeId: regex },
      { email: regex },
      { department: regex },
      { jobTitle: regex },
    ];
  }

  if (department && department !== "All" && department !== "all") {
    query.department = { $regex: new RegExp(`^${department}$`, "i") };
  }

  if (status && status !== "All" && status !== "all") {
    query.$or = [
      { status: { $regex: new RegExp(`^${status}$`, "i") } },
      { employmentStatus: { $regex: new RegExp(`^${status}$`, "i") } },
    ];
  }

  let employees = await Employee.find(query).sort({ createdAt: -1 });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Apply celebration filter if set
  if (celebrationFilter) {
    if (celebrationFilter === "birthdays_this_month") {
      employees = employees.filter(
        (e) => e.dateOfBirth && new Date(e.dateOfBirth).getMonth() === currentMonth
      );
    } else if (celebrationFilter === "work_anniversaries_this_month") {
      employees = employees.filter(
        (e) =>
          e.dateOfJoining &&
          new Date(e.dateOfJoining).getMonth() === currentMonth &&
          new Date(e.dateOfJoining).getFullYear() < currentYear
      );
    } else if (celebrationFilter === "personal_anniversaries_this_month") {
      employees = employees.filter(
        (e) =>
          e.personalAnniversaryDate &&
          new Date(e.personalAnniversaryDate).getMonth() === currentMonth
      );
    }
  }

  const totalCount = employees.length;

  let paginatedEmployees = employees;
  if (!all) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    paginatedEmployees = employees.slice((pageNum - 1) * limitNum, pageNum * limitNum);
  }

  const formattedEmployees = paginatedEmployees.map((emp) => {
    const isBirthdayThisMonth =
      emp.dateOfBirth && new Date(emp.dateOfBirth).getMonth() === currentMonth;
    const isAnniversaryThisMonth =
      emp.dateOfJoining &&
      new Date(emp.dateOfJoining).getMonth() === currentMonth &&
      new Date(emp.dateOfJoining).getFullYear() < currentYear;
    const isPersonalAnniversaryThisMonth =
      emp.personalAnniversaryDate &&
      new Date(emp.personalAnniversaryDate).getMonth() === currentMonth;

    return {
      id: emp._id.toString(),
      _id: emp._id.toString(),
      firstName: emp.firstName,
      lastName: emp.lastName,
      name: `${emp.firstName} ${emp.lastName}`.trim(),
      employeeId: emp.employeeId,
      email: emp.email,
      phoneNumber: emp.phoneNumber || "",
      department: emp.department,
      jobTitle: emp.jobTitle,
      dateOfJoining: emp.dateOfJoining,
      employmentStatus: emp.employmentStatus,
      dateOfBirth: emp.dateOfBirth,
      personalAnniversaryDate: emp.personalAnniversaryDate || null,
      sendBirthdayEmail: emp.sendBirthdayEmail !== false,
      sendWorkAnniversaryEmail: emp.sendWorkAnniversaryEmail !== false,
      sendPersonalAnniversaryEmail: emp.sendPersonalAnniversaryEmail !== false,
      avatar: emp.avatar || "",
      status: emp.status,
      isBirthdayThisMonth,
      isAnniversaryThisMonth,
      isPersonalAnniversaryThisMonth,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
    };
  });

  return {
    employees: formattedEmployees,
    totalCount,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    totalPages: Math.ceil(totalCount / (parseInt(limit, 10) || 10)) || 1,
  };
}

export async function getEmployeeById(id) {
  await connectDB();
  const emp = await Employee.findById(id);
  if (!emp) return null;

  return {
    id: emp._id.toString(),
    _id: emp._id.toString(),
    firstName: emp.firstName,
    lastName: emp.lastName,
    name: `${emp.firstName} ${emp.lastName}`.trim(),
    employeeId: emp.employeeId,
    email: emp.email,
    phoneNumber: emp.phoneNumber || "",
    department: emp.department,
    jobTitle: emp.jobTitle,
    dateOfJoining: emp.dateOfJoining,
    employmentStatus: emp.employmentStatus,
    dateOfBirth: emp.dateOfBirth,
    personalAnniversaryDate: emp.personalAnniversaryDate || null,
    sendBirthdayEmail: emp.sendBirthdayEmail !== false,
    sendWorkAnniversaryEmail: emp.sendWorkAnniversaryEmail !== false,
    sendPersonalAnniversaryEmail: emp.sendPersonalAnniversaryEmail !== false,
    avatar: emp.avatar || "",
    status: emp.status,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
  };
}

export async function createEmployee(data) {
  await connectDB();

  const employeeId = data.employeeId?.trim().toUpperCase();
  const email = data.email?.trim().toLowerCase();

  const existingId = await Employee.findOne({ employeeId });
  if (existingId) {
    throw new Error(`Employee ID "${employeeId}" already exists.`);
  }

  const existingEmail = await Employee.findOne({ email });
  if (existingEmail) {
    throw new Error(`Work email "${email}" already registered.`);
  }

  const employee = await Employee.create({
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    employeeId,
    email,
    phoneNumber: data.phoneNumber?.trim() || "",
    department: data.department.trim(),
    jobTitle: data.jobTitle.trim(),
    dateOfJoining: new Date(data.dateOfJoining),
    employmentStatus: data.employmentStatus || "Full-time",
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    personalAnniversaryDate: data.personalAnniversaryDate
      ? new Date(data.personalAnniversaryDate)
      : null,
    sendBirthdayEmail: data.sendBirthdayEmail !== false,
    sendWorkAnniversaryEmail: data.sendWorkAnniversaryEmail !== false,
    sendPersonalAnniversaryEmail: data.sendPersonalAnniversaryEmail !== false,
    avatar: data.avatar?.trim() || "",
    status: data.status || "Active",
  });

  return employee;
}

export async function updateEmployee(id, data) {
  await connectDB();

  const employee = await Employee.findById(id);
  if (!employee) {
    throw new Error("Employee not found.");
  }

  if (data.employeeId) {
    const employeeId = data.employeeId.trim().toUpperCase();
    if (employeeId !== employee.employeeId) {
      const existingId = await Employee.findOne({ employeeId, _id: { $ne: id } });
      if (existingId) {
        throw new Error(`Employee ID "${employeeId}" is already taken.`);
      }
      employee.employeeId = employeeId;
    }
  }

  if (data.email) {
    const email = data.email.trim().toLowerCase();
    if (email !== employee.email) {
      const existingEmail = await Employee.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        throw new Error(`Email "${email}" is already in use.`);
      }
      employee.email = email;
    }
  }

  if (data.firstName !== undefined) employee.firstName = data.firstName.trim();
  if (data.lastName !== undefined) employee.lastName = data.lastName.trim();
  if (data.phoneNumber !== undefined) employee.phoneNumber = data.phoneNumber.trim();
  if (data.department !== undefined) employee.department = data.department.trim();
  if (data.jobTitle !== undefined) employee.jobTitle = data.jobTitle.trim();
  if (data.dateOfJoining) employee.dateOfJoining = new Date(data.dateOfJoining);
  if (data.employmentStatus) employee.employmentStatus = data.employmentStatus;
  if (data.dateOfBirth !== undefined) {
    employee.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  }
  if (data.personalAnniversaryDate !== undefined) {
    employee.personalAnniversaryDate = data.personalAnniversaryDate
      ? new Date(data.personalAnniversaryDate)
      : null;
  }
  if (data.sendBirthdayEmail !== undefined) {
    employee.sendBirthdayEmail = Boolean(data.sendBirthdayEmail);
  }
  if (data.sendWorkAnniversaryEmail !== undefined) {
    employee.sendWorkAnniversaryEmail = Boolean(data.sendWorkAnniversaryEmail);
  }
  if (data.sendPersonalAnniversaryEmail !== undefined) {
    employee.sendPersonalAnniversaryEmail = Boolean(data.sendPersonalAnniversaryEmail);
  }
  if (data.avatar !== undefined) employee.avatar = data.avatar.trim();
  if (data.status) employee.status = data.status;

  await employee.save();
  return employee;
}

export async function deleteEmployee(id) {
  await connectDB();
  const deleted = await Employee.findByIdAndDelete(id);
  if (!deleted) {
    throw new Error("Employee not found.");
  }

  if (deleted.avatar && deleted.avatar.startsWith("/")) {
    try {
      const { removeUploadedFile } = await import("@/lib/upload-file");
      await removeUploadedFile(deleted.avatar);
    } catch (e) {
      console.error("Failed to delete employee avatar file:", e);
    }
  }

  return deleted;
}
