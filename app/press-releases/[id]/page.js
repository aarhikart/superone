import Link from "next/link";

import { ContentPageShell } from "@/app/_components/content/content-page-shell";
import { getPressReleaseById, getPressReleases } from "@/lib/press-release-service";

/* eslint-disable @next/next/no-img-element */

export const dynamic = "force-dynamic";

function formatDate(value) {
  if (!value) {
    return "Latest update";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

export default async function PressReleaseDetailPage({ params }) {
  const { id } = await params;
  const pressRelease = await getPressReleaseById(id);
  const pressReleases = await getPressReleases();

  if (!pressRelease) {
    return (
      <ContentPageShell>
        <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-36">
          <div className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/5 px-6 py-14 text-center shadow-[0_20px_70px_rgba(2,6,23,0.32)] sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Press Release Detail</p>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Press release not found
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              The press release you are trying to open is unavailable right now.
            </p>
            <Link
              href="/press-releases"
              className="mt-8 inline-flex rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400 hover:text-slate-950"
            >
              Back to Press Releases
            </Link>
          </div>
        </section>
      </ContentPageShell>
    );
  }

  const suggestedPressReleases = pressReleases.filter((item) => String(item._id) !== String(id));

  return (
    <ContentPageShell>
      <section className="relative overflow-hidden bg-[#030712] px-4 pb-12 pt-24 sm:px-6 lg:px-8 lg:pb-16 lg:pt-28">
        <div className="mx-auto max-w-7xl">
          {/* Back to Press Releases Navigation */}
          <Link
            href="/press-releases"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 transition hover:text-cyan-300"
          >
            <span>←</span> Back to Press Releases
          </Link>

          {/* Press Release Header Details */}
          <header className="mt-8 max-w-4xl">
            <h3 className=" font-bold tracking-tight sm:text-3xl lg:text-2xl leading-snug">
              {pressRelease.title}
            </h3>
            
            <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500" />
              <time>{formatDate(pressRelease.createdAt)}</time>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500" />
              <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-white/5">
                Published
              </span>
            </div>
          </header>

          {/* Main Layout Grid */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            
            {/* Left Content Area */}
            <div className="space-y-6">
              {/* Main Visual Image Area */}
              <div className="overflow-hidden rounded-lg border border-white/5 bg-[#0B0F19]">
                <img 
                  src={pressRelease.image} 
                  alt={pressRelease.title || "Press release cover"} 
                  className="w-full object-cover max-h-[500px]" 
                />
              </div>

              {/* Description UI Wrapper Area */}
            <div className="rounded-lg border bg-[#0d1425] border-white/5  p-6 sm:p-8 shadow-inner">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-6">
                    <div className="h-1 w-4 bg-cyan-500 rounded"></div>
                    <h2 className="text-lg font-semibold text-white">Content Overview</h2>
                  </div>

                {/* Dynamic Paragraphs Styling */}
                <article className="mt-6 text-sm leading-7 space-y-5 text-gray-400 text-sm md:text-base leading-relaxed">
                  {String(pressRelease.description || "")
                    .split(/\n+/)
                    .filter(Boolean)
                    .map((paragraph, index) => (
                      <p key={`${pressRelease._id}-paragraph-${index}`}>{paragraph}</p>
                    ))}
                </article>
              </div>

              {pressRelease.liveUrl ? (
                <div className="pt-2">
                  <a
                    href={pressRelease.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden rounded-lg  px-6 py-2  lg:inline-flex px-6 rounded-lg bg-[#00AEEF] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#0095cc] transition shadow-[0_0_30px_rgba(0,174,239,0.25)]"
                  >
                    View Live Press Release
                  </a>
                </div>
              ) : null}
            </div>

            {/* Right Side Sidebar (Suggested Reading) */}
            <aside className="h-fit rounded-lg border border-white/5 bg-[#0d1425] p-6 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Suggested Reading
              </p>

              <div className="mt-6 space-y-4">
                {suggestedPressReleases.map((item) => (
                  <Link
                    key={item._id.toString()}
                    href={`/press-releases/${item._id}`}
                    className="group flex gap-4 rounded-lg border border-transparent p-2 transition hover:border-white/5 hover:bg-white/5"
                  >
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800 border border-white/5">
                      <img 
                        src={item.image} 
                        alt={item.title || "Suggested press release thumb"} 
                        className="h-full w-full object-cover" 
                      />
                    </div>

                    <div className="min-w-0 flex-1 py-1">
                      <h3 className="line-clamp-2 text-xs font-semibold text-white transition group-hover:text-[#29adec]">
                        {item.title}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {suggestedPressReleases.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-slate-500">
                  No suggested press releases available yet.
                </div>
              ) : null}
            </aside>

          </div>
        </div>
      </section>
    </ContentPageShell>
  );
}