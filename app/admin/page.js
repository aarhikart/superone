import { getArticles } from "@/lib/article-service";
import { getJobs } from "@/lib/job-service";
import { getPressReleases } from "@/lib/press-release-service";
import { connectDB } from "@/lib/mongodb";
import Post from "@/models/Post";
import JobApplication from "@/models/JobApplication";
import PocRequest from "@/models/PocRequest";
import ContactMessage from "@/models/ContactMessage";
import WebsiteVisitor from "@/models/WebsiteVisitor";
import { requireAdminUser } from "@/lib/auth";
import AdminDashboardClient from "./_components/admin-dashboard-client";

export const dynamic = "force-dynamic";

function serializeDoc(doc) {
  if (!doc) return null;
  return {
    ...doc,
    _id: doc._id ? doc._id.toString() : "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

export default async function AdminDashboardPage() {
  const currentUser = await requireAdminUser();
  await connectDB();

  // Fetch all collections in parallel
  const [
    jobs,
    articles,
    pressReleases,
    totalBlogs,
    rawJobApps,
    rawPocReqs,
    rawContactMsgs,
    visitorCounter,
    rawTopBlogs,
  ] = await Promise.all([
    getJobs(),
    getArticles(),
    getPressReleases(),
    Post.countDocuments(),
    JobApplication.find({}).sort({ createdAt: -1 }).lean(),
    PocRequest.find({}).sort({ createdAt: -1 }).lean(),
    ContactMessage.find({}).sort({ createdAt: -1 }).lean(),
    WebsiteVisitor.findOne({ key: "landing-page" }).lean(),
    Post.find({}).sort({ views: -1 }).limit(5).lean(),
  ]);

  // Serialize to prevent Server Component serialization errors
  const jobApps = rawJobApps.map(serializeDoc);
  const pocReqs = rawPocReqs.map(serializeDoc);
  const contactMsgs = rawContactMsgs.map(serializeDoc);
  const topBlogs = rawTopBlogs.map(serializeDoc);

  // Build Recent Activity / Live Alerts Feed (top 5 across all collections)
  const recentAlertsList = [
    ...jobApps.slice(0, 5).map((app) => ({
      icon: "🆕",
      title: "New Job Application",
      name: `${app.firstName} ${app.lastName}`,
      detail: app.roleTitle,
      createdAt: app.createdAt,
    })),
    ...pocReqs.slice(0, 5).map((app) => ({
      icon: "🤝",
      title: "New POC Request",
      name: app.company,
      detail: app.fullName,
      createdAt: app.createdAt,
    })),
    ...contactMsgs.slice(0, 5).map((app) => ({
      icon: "📩",
      title: "New Contact Message",
      name: app.name,
      detail: app.company || "Direct Inquiry",
      createdAt: app.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <AdminDashboardClient
      currentUser={JSON.parse(JSON.stringify(currentUser))}
      jobs={JSON.parse(JSON.stringify(jobs))}
      articles={JSON.parse(JSON.stringify(articles))}
      pressReleases={JSON.parse(JSON.stringify(pressReleases))}
      totalBlogs={totalBlogs}
      jobApps={JSON.parse(JSON.stringify(jobApps))}
      pocReqs={JSON.parse(JSON.stringify(pocReqs))}
      contactMsgs={JSON.parse(JSON.stringify(contactMsgs))}
      visitorCounter={JSON.parse(JSON.stringify(visitorCounter))}
      recentAlertsList={JSON.parse(JSON.stringify(recentAlertsList))}
      topBlogs={JSON.parse(JSON.stringify(topBlogs))}
    />
  );
}
