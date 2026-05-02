import React, { useMemo, useState } from 'react';
import { Cable, CheckCircle2, ExternalLink, KeyRound, Lock, PlugZap, Search, ShieldAlert, Workflow } from 'lucide-react';
import { SOURCE_CATALOG } from '../../data/sourceCatalog';
import { ConnectorCategory, PublicSourceCandidate } from '../../types';

const CATEGORY_LABELS: Record<ConnectorCategory | 'all', string> = {
  all: 'All Sources',
  identity: 'Identity',
  cloud: 'Cloud',
  endpoint: 'Endpoint',
  security: 'Security',
  robotics: 'Robotics',
  workflow: 'Workflow',
  business: 'Business',
  maps: 'Maps',
  custom: 'Custom',
};

const usageTone: Record<PublicSourceCandidate['recommendedUse'], string> = {
  feed: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
  enrichment: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
  workflow_action: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  reference: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
};

function AuthBadge({ source }: { source: PublicSourceCandidate }) {
  const Icon = source.auth === 'none' ? CheckCircle2 : KeyRound;
  return (
    <span className="inline-flex items-center gap-1 rounded border border-surface-600 bg-surface-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
      <Icon className="h-3 w-3" />
      {source.auth}
    </span>
  );
}

function SourceCard({ source }: { source: PublicSourceCandidate }) {
  return (
    <article className="rounded-lg border border-surface-700 bg-surface-900/80 p-4 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
              {CATEGORY_LABELS[source.category]}
            </span>
            <span className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${usageTone[source.recommendedUse]}`}>
              {source.recommendedUse.replace('_', ' ')}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-100">{source.name}</h3>
        </div>
        <Cable className="h-5 w-5 shrink-0 text-slate-500" />
      </div>

      <p className="mt-3 min-h-[48px] text-xs leading-5 text-slate-400">{source.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <AuthBadge source={source} />
        <span className="inline-flex items-center gap-1 rounded border border-surface-600 bg-surface-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
          <Lock className="h-3 w-3" /> HTTPS {source.https ? 'YES' : 'NO'}
        </span>
        <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
          {source.status.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-4 border-t border-surface-700 pt-3">
        <a
          href={source.url.startsWith('internal://') ? undefined : source.url}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-2 text-xs font-semibold ${source.url.startsWith('internal://') ? 'cursor-default text-slate-500' : 'text-cyan-300 hover:text-cyan-200'}`}
        >
          {source.url.startsWith('internal://') ? 'Internal template only' : 'Open reference'}
          {!source.url.startsWith('internal://') && <ExternalLink className="h-3 w-3" />}
        </a>
      </div>
    </article>
  );
}

export function ConnectorView() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ConnectorCategory | 'all'>('all');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(SOURCE_CATALOG.map(source => source.category)));
    return ['all', ...unique] as Array<ConnectorCategory | 'all'>;
  }, []);

  const filteredSources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return SOURCE_CATALOG.filter(source => {
      const matchesCategory = category === 'all' || source.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        source.name.toLowerCase().includes(normalizedQuery) ||
        source.description.toLowerCase().includes(normalizedQuery) ||
        source.recommendedUse.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <section className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-surface-700 bg-surface-900/70 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
              <PlugZap className="h-4 w-4" /> Connector Registry Foundation
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-50">Source Catalog & Connector Design</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Reference-only connector inventory inspired by public API catalogs and OpenAPI discovery tools. These sources are not live integrations until credentials, backend routes, rate limits, and verification are added.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded border border-surface-700 bg-surface-800 px-4 py-3">
              <div className="text-lg font-black text-cyan-300">{SOURCE_CATALOG.length}</div>
              <div className="uppercase tracking-[0.16em] text-slate-500">Sources</div>
            </div>
            <div className="rounded border border-surface-700 bg-surface-800 px-4 py-3">
              <div className="text-lg font-black text-emerald-300">0</div>
              <div className="uppercase tracking-[0.16em] text-slate-500">Live</div>
            </div>
            <div className="rounded border border-surface-700 bg-surface-800 px-4 py-3">
              <div className="text-lg font-black text-amber-300">Demo</div>
              <div className="uppercase tracking-[0.16em] text-slate-500">Truth</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden p-6">
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Truth boundary</p>
              <p className="mt-1 text-xs leading-5 text-amber-100/80">
                This screen is a connector planning registry. It does not call Okta, AWS, CrowdStrike, URLhaus, or any external API. Real connectors require server-side credentials, explicit enablement, error handling, and audit logging.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search sources, uses, or descriptions..."
              className="w-full rounded border border-surface-700 bg-surface-900 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500/60"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(item => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition ${
                  category === item
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                    : 'border-surface-700 bg-surface-900 text-slate-500 hover:text-slate-200'
                }`}
              >
                {CATEGORY_LABELS[item]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredSources.map(source => <SourceCard key={source.id} source={source} />)}
        </div>

        <div className="mt-4 rounded-lg border border-surface-700 bg-surface-900/80 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
            <Workflow className="h-4 w-4 text-cyan-300" /> Next connector step
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Add connector manifests and server-side handlers next. Each live connector should declare auth type, allowed endpoints, rate limits, read/write capability, failure modes, and audit events before it can generate feed signals or execute workflow actions.
          </p>
        </div>
      </div>
    </section>
  );
}
