import Link from "next/link";

import { ContentPageShell } from "@/app/_components/content/content-page-shell";
import { PageHero } from "@/app/_components/content/page-hero";
import { getArticles } from "@/lib/article-service";
// import Hero from "../admin/_components/mediaPost/hero";

/* eslint-disable @next/next/no-img-element */

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <ContentPageShell surface="light">
    {/* <Hero title="Prisma`s Articles" description="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966"/> */}

      <section className="bg-[#020618] px-4 py-16 sm:px-6 lg:px-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Section Heading */}
        <h2 className="mb-10 text-3xl  tracking-tight text-white sm:text-4xl">
          Recent Post
        </h2>

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-14 text-center text-slate-400">
            No articles are available yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article._id.toString()}
                href={`/articles/${article._id}`}
                className="group flex flex-col justify-between overflow-hidden rounded-lg border border-white/[0.06] bg-[#0d1425] p-5 transition duration-300 hover:border-cyan-500/40 hover:bg-[#0F1A30]"
              >
                <div>
                  {/* Image Frame with Overlay Badge */}
                  <div className="relative overflow-hidden rounded-lg aspect-[16/10] w-full">
                    <img
                      src={article.image}
                      alt={article.title || "Article image"}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                 
                  </div>

                  {/* Body Content */}
                  <div className="mt-5">
              
                    
                    <h3 className="mt-3 text-xl font-semibold leading-snug text-slate-100 transition group-hover:text-white">
                      {article.title}
                    </h3>
                    
                    {article.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-400">
                        {article.description}
                      </p>
                    )}
                    
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-8 flex items-center justify-between border-t border-white/[0.04] pt-4 text-lg font-medium text-slate-500 transition group-hover:text-[#29adec]">
                  <span>Open details</span>
                  <svg
                    className="h-6 w-6 transform transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14M12 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
    </ContentPageShell>
  );
}