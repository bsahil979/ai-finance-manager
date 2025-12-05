import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero Section */}
      <section className="w-full px-8 py-20 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
              AI Finance Manager
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
              Take control of your{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                finances
              </span>{" "}
              with AI
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl">
              Import transactions, detect hidden subscriptions, visualize spending,
              and get AI-powered insights to make smarter financial decisions.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900 transition-colors"
            >
              View Demo
            </Link>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-6 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>Privacy-first</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full border-t border-zinc-900 bg-zinc-900/50 px-8 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Everything you need to manage your money
            </h2>
            <p className="mt-4 text-zinc-400">
              Powerful features designed to help you understand and optimize your finances
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="📊"
              title="Smart Dashboard"
              description="Real-time financial overview with income, expenses, and net worth at a glance."
            />
            <FeatureCard
              icon="📁"
              title="CSV Import/Export"
              description="Easily import bank statements and export your data for backup or analysis."
            />
            <FeatureCard
              icon="🤖"
              title="AI-Powered Insights"
              description="Get natural language explanations of your spending patterns using Gemini AI."
            />
            <FeatureCard
              icon="🔄"
              title="Subscription Detection"
              description="Automatically identify recurring payments and track renewal dates."
            />
            <FeatureCard
              icon="📈"
              title="Spending Analytics"
              description="Visual charts showing where your money goes by merchant and category."
            />
            <FeatureCard
              icon="🔔"
              title="Smart Alerts"
              description="Get notified about upcoming renewals and unusual spending patterns."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full px-8 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-zinc-400">
              Get started in minutes with three simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              number="1"
              title="Import Your Data"
              description="Upload your bank statements as CSV files. We support standard formats with date, amount, merchant, and description columns."
            />
            <StepCard
              number="2"
              title="Let AI Analyze"
              description="Our system automatically detects subscriptions, categorizes spending, and identifies patterns in your financial data."
            />
            <StepCard
              number="3"
              title="Get Insights"
              description="Receive AI-powered recommendations, track subscriptions, and visualize your spending to make better financial decisions."
            />
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="w-full border-t border-zinc-900 bg-zinc-900/50 px-8 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Built with modern technology
            </h2>
            <p className="mt-4 text-zinc-400">
              Industry-standard tools for a production-ready application
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <TechBadge label="Next.js 16" />
            <TechBadge label="TypeScript" />
            <TechBadge label="MongoDB Atlas" />
            <TechBadge label="Gemini AI" />
            <TechBadge label="Tailwind CSS" />
            <TechBadge label="React 19" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full border-t border-zinc-900 px-8 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to take control of your finances?
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Start tracking your spending, detecting subscriptions, and getting AI insights today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300 transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900 transition-colors"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 transition-colors">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

type StepCardProps = {
  number: string;
  title: string;
  description: string;
};

function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="relative">
      <div className="absolute -left-4 top-0 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 text-lg font-bold text-zinc-950">
        {number}
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 pl-16">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

type TechBadgeProps = {
  label: string;
};

function TechBadge({ label }: TechBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

