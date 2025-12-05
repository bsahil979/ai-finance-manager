import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="w-full px-8 py-16">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl mb-4">
              About{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                AI Finance Manager
              </span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Empowering individuals to take control of their finances with
              AI-powered insights and smart automation.
            </p>
          </div>

          {/* Mission Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 space-y-4 text-zinc-300">
              <p>
                At AI Finance Manager, we believe that everyone deserves to have
                a clear understanding of their financial health. Our mission is to
                make personal finance management accessible, intuitive, and
                intelligent.
              </p>
              <p>
                We combine the power of artificial intelligence with modern web
                technology to help you track spending, identify hidden
                subscriptions, visualize financial patterns, and make informed
                decisions about your money.
              </p>
            </div>
          </section>

          {/* What We Do */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6">What We Do</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold mb-2">
                  Financial Tracking
                </h3>
                <p className="text-sm text-zinc-400">
                  Import and organize all your transactions in one place. Get a
                  comprehensive view of your income, expenses, and net worth.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
                <p className="text-sm text-zinc-400">
                  Leverage Google&apos;s Gemini AI to get natural language
                  explanations of your spending patterns and personalized saving
                  recommendations.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="text-3xl mb-3">🔄</div>
                <h3 className="text-lg font-semibold mb-2">
                  Subscription Detection
                </h3>
                <p className="text-sm text-zinc-400">
                  Automatically identify recurring payments and subscriptions from
                  your transaction history. Never lose track of what you&apos;re
                  paying for.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="text-3xl mb-3">🔔</div>
                <h3 className="text-lg font-semibold mb-2">Smart Alerts</h3>
                <p className="text-sm text-zinc-400">
                  Get notified about upcoming subscription renewals and unusual
                  spending patterns. Stay on top of your finances effortlessly.
                </p>
              </div>
            </div>
          </section>

          {/* Technology */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6">Built With Modern Technology</h2>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-zinc-300 mb-4">
                AI Finance Manager is built using industry-standard technologies
                to ensure reliability, security, and performance:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-zinc-300">Next.js 16 & React 19</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-zinc-300">TypeScript</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-zinc-300">MongoDB Atlas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-zinc-300">Google Gemini AI</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-zinc-300">Tailwind CSS</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span className="text-zinc-300">RESTful API Architecture</span>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy & Security */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-4">Privacy & Security</h2>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 space-y-3 text-zinc-300">
              <p>
                Your financial data is important to us. We implement industry-standard
                security practices to protect your information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400 ml-4">
                <li>All data is encrypted in transit and at rest</li>
                <li>User authentication with secure session management</li>
                <li>Data isolation - your information is only accessible to you</li>
                <li>No sharing of your financial data with third parties</li>
                <li>Regular security audits and updates</li>
              </ul>
            </div>
          </section>

          {/* About the Developer */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-4">About the Developer</h2>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
              <p className="text-zinc-300 mb-4">
                AI Finance Manager is a portfolio project developed by{" "}
                <span className="text-emerald-400 font-medium">Sahil Belchada</span>,
                showcasing full-stack development skills with modern technologies.
              </p>
              <p className="text-zinc-300 mb-4">
                This project demonstrates expertise in:
              </p>
              <div className="grid gap-2 sm:grid-cols-2 text-sm text-zinc-400">
                <div>• Full-stack web development</div>
                <div>• AI/LLM integration</div>
                <div>• Database design & management</div>
                <div>• RESTful API development</div>
                <div>• User authentication & security</div>
                <div>• Modern UI/UX design</div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
            <p className="text-zinc-400 mb-6">
              Join us and take control of your financial future today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300 transition-colors"
              >
                Create Free Account
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900 transition-colors"
              >
                View Demo
              </Link>
            </div>
          </section>

          {/* Back Link */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-400"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

