import { getClusterStatus } from "@/src/lib/api";
import { StatCard } from "./components/StatCard";
import { NodeRow } from "./components/NodeRow";
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards">
          <StatCard
            label="Cluster Health"
            value={data.status}
            status={data.status === 'healthy' ? 'healthy' : data.status === 'degraded' ? 'warning' : 'danger'}
          >
            <div className="text-xs text-gray-500 mt-2">
              {data.status === 'healthy' ? 'All systems operational' : 'Attention required'}
            </div>
          </StatCard>

          <StatCard
            label="Storage"
            value={data.used_storage}
            subValue={`/ ${data.total_storage}`}
          >
            <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
              {/* Visual placeholder until we aggregate real storage data */}
              <div className="h-full bg-blue-500 w-[1%]" />
            </div>
          </StatCard>

          <StatCard
            label="Nodes"
            value={data.node_count}
            subValue="Total"
            status="neutral"
          >
            <div className="text-xs text-gray-500 mt-2">
              {data.nodes.filter(n => n.is_up).length} Active Now
            </div>
          </StatCard>
        </div>

        {/* Node List */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-semibold text-white">Cluster Nodes</h2>
            <div className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              Live Data
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {data.nodes.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-white/5 rounded-2xl italic">
                No nodes found or unable to connect to Garage.
              </div>
            ) : (
              data.nodes.map((node) => (
                <NodeRow
                  key={node.id}
                  id={node.id}
                  hostname={node.hostname}
                  isUp={node.is_up}
                  lastSeen={node.last_seen}
                  usagePercent={node.usagePercent}
                  storageUsed={node.storageUsed}
                />
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
