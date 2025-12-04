import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="flex w-full flex-col gap-10 px-8 py-16 md:flex-row md:items-center">
        <section className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            AI Finance Manager
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Understand your money with{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              AI-powered
            </span>{" "}
            insights.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-zinc-400 md:text-base">
            Import your transactions, spot hidden subscriptions, and let AI
            explain where your money goes each month. Built with Next.js,
            TypeScript, MongoDB, and LLMs as a real-world portfolio project.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
            >
              Go to dashboard
            </Link>
            <Link
              href="/transactions"
              className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900"
            >
              Import transactions
            </Link>
          </div>

          <div className="mt-8 grid gap-3 text-xs text-zinc-400 sm:grid-cols-3">
            <FeatureBadge label="Next.js + TypeScript" />
            <FeatureBadge label="MongoDB-backed API" />
            <FeatureBadge label="AI insights (LLM-powered)" />
          </div>
        </section>

        <section className="flex-1 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-black p-5 shadow-xl">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Preview
          </p>
          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-xs font-medium text-zinc-400">
                This month&apos;s summary
              </p>
              <p className="mt-1 text-sm text-zinc-100">
                You&apos;ve spent{" "}
                <span className="text-red-400">more on subscriptions</span> than
                groceries. Cancelling 2 unused services would save you{" "}
                <span className="text-emerald-400">$180/year</span>.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <MiniStat label="Imported txns" value="3" />
              <MiniStat label="Monthly net" value="+$1,974.51" positive />
              <MiniStat label="Subscriptions" value="Coming soon" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

type BadgeProps = {
  label: string;
};

function FeatureBadge({ label }: BadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      <span>{label}</span>
    </div>
  );
}

type MiniStatProps = {
  label: string;
  value: string;
  positive?: boolean;
};

function MiniStat({ label, value, positive }: MiniStatProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          positive ? "text-emerald-400" : "text-zinc-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

