import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
      <div className="text-center px-8">
        <h1 className="text-4xl font-semibold tracking-tight mb-4">404</h1>
        <p className="text-zinc-400 mb-6">Page not found</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-emerald-300"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}

