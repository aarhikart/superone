export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pb-28">
      <div className="prism-orb prism-orb-left" />
      <div className="prism-orb prism-orb-right" />
      <div className="mx-auto grid max-w-7xl gap-10 rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.92)_0%,rgba(2,6,23,0.96)_100%)] px-6 py-16 shadow-[0_40px_140px_rgba(2,6,23,0.65)] sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-14">
        <div className="relative z-10">
          <span className="inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-200">
            Enterprise AI Systems
          </span>
          <h1 className="mt-8 max-w-4xl font-display text-5xl font-semibold leading-[0.96] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            Your Data. Your Decisions. One Trusted AI Layer.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Prism.ai helps enterprise teams convert risk, security, document, and identity workflows into responsive AI systems that stay explainable, secure, and business-ready.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:translate-y-[-2px] hover:bg-white"
            >
              Book POC
            </a>
            <a
              href="#products"
              className="inline-flex items-center justify-center rounded-full border border-white/[0.12] bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-300/40 hover:bg-white/[0.08]"
            >
              Explore Products
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <div className="flex -space-x-3">
              {["A", "I", "Q"].map((item) => (
                <span
                  key={item}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-900 bg-slate-200 text-xs font-semibold text-slate-900"
                >
                  {item}
                </span>
              ))}
            </div>
            <span>Trusted by transformation teams across compliance-heavy environments.</span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center">
          <div className="relative w-full max-w-xl rounded-[34px] border border-white/10 bg-white/5 p-4 shadow-[0_30px_90px_rgba(8,47,73,0.35)] backdrop-blur">
            <div className="rounded-[28px] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(8,47,73,0.45)_0%,rgba(15,23,42,0.78)_100%)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Prism Control Layer</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-white">AI orchestration with measurable confidence.</h2>
                </div>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Live
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["Risk Signals", "1.28M"],
                  ["Verified Entities", "450K"],
                  ["Policy Checks", "98.4%"],
                  ["Response Time", "0.8s"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[24px] border border-white/[0.08] bg-slate-950/45 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{label}</p>
                    <p className="mt-3 font-display text-3xl font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[24px] border border-cyan-400/10 bg-cyan-400/[0.08] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Workflow Pulse</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Live orchestration across verification, fraud review, document intake, and secure remediation.
                    </p>
                  </div>
                  <div className="h-20 w-20 rounded-full border border-cyan-300/20 bg-[radial-gradient(circle,rgba(34,211,238,0.45),rgba(8,47,73,0.12)_58%,transparent_62%)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </section>
  );
}
