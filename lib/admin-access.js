export const ADMIN_ROLES = {
  ADMIN: "Admin",
  HR: "HR",
  MARKETING: "Marketing",
};

export const ADMIN_NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    roles: [ADMIN_ROLES.ADMIN, ADMIN_ROLES.HR, ADMIN_ROLES.MARKETING],
  },
  {
    href: "/admin/employees",
    label: "Employees",
    roles: [ADMIN_ROLES.ADMIN, ADMIN_ROLES.HR],
  },
  {
    href: "/admin/celebrations",
    label: "Celebrations",
    roles: [ADMIN_ROLES.ADMIN, ADMIN_ROLES.HR],
  },
  {
    href: "/admin/blogs",
    label: "Blogs",
    roles: [ADMIN_ROLES.ADMIN, ADMIN_ROLES.MARKETING],
  },
  {
    href: "/admin/articles",
    label: "Articles",
    roles: [ADMIN_ROLES.ADMIN, ADMIN_ROLES.MARKETING],
  },
  {
    href: "/admin/jobs",
    label: "Jobs",
    roles: [ADMIN_ROLES.ADMIN, ADMIN_ROLES.HR],
  },
  {
    href: "/admin/press-releases",
    label: "Press Releases",
    roles: [ADMIN_ROLES.ADMIN, ADMIN_ROLES.MARKETING],
  },
  {
    href: "/admin/job-applications",
    label: "Job Applications",
    roles: [ADMIN_ROLES.ADMIN, ADMIN_ROLES.HR],
  },
  {
    href: "/admin/employee-extensions",
    label: "Employee Extensions",
    roles: [ADMIN_ROLES.ADMIN, ADMIN_ROLES.HR],
  },
  {
    href: "/admin/poc-requests",
    label: "POC Requests",
    roles: [ADMIN_ROLES.ADMIN],
  },
  {
    href: "/admin/contact-messages",
    label: "Contact Messages",
    roles: [ADMIN_ROLES.ADMIN],
  },
  {
    href: "/admin/login-management",
    label: "Login Management",
    roles: [ADMIN_ROLES.ADMIN],
  },
];

export function getNavItemsForRole(role) {
  return ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function canAccessAdminPath(role, pathname) {
  if (!role) {
    return false;
  }

  const normalizedPath = pathname === "/admin/dashboard" ? "/admin" : pathname;

  return ADMIN_NAV_ITEMS.some((item) => {
    const isMatch =
      normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`);

    return isMatch && item.roles.includes(role);
  });
}
