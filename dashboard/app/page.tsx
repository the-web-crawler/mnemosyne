import { getClusterStatus } from "@/src/lib/api";
import { DashboardStatus } from "./components/DashboardStatus";
import Image from "next/image";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getClusterStatus();

  return (
    <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)] selection:bg-blue-500/30">
      <main className="max-w-5xl mx-auto flex flex-col gap-12">

        {/* Header */}
        <header className="flex flex-col gap-4 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/logo.webp"
                alt="Mnemosyne Logo"
                width={64}
                height={64}
                className="rounded-2xl shadow-2xl shadow-emerald-500/20"
              />
              <h1 className="text-5xl font-bold tracking-tight text-white">
                Mnemosyne
              </h1>
            </div>
            <Link
              href="/explorer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></svg>
              Browse Files
            </Link>
          </div>
          <p className="text-gray-400 text-lg max-w-lg leading-relaxed">
            Your self-healing, distributed family archive.
            <span className="block text-sm text-gray-500 mt-1">v1.0.0 • Local Node Dashboard</span>
          </p>
        </header>

        {/* Client Component for Live Updates */}
        <DashboardStatus initialData={data} />

      </main>
    </div>
  );
}
