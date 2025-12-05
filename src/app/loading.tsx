export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-400 border-r-transparent"></div>
          <p className="mt-4 text-sm text-zinc-400">Loading...</p>
        </div>
      </div>
    </main>
  );
}

