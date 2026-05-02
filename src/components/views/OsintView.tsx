import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, DatabaseZap, ExternalLink, FileSearch, GitBranch, Loader2, Search, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { usePlatformStore } from '../../store/usePlatformStore';
import { EnrichmentConnectorId, Finding, OsintSeedType } from '../../types';

const SEED_TYPES: Array<{ id: OsintSeedType; label: string; hint: string }> = [
  { id: 'domain', label: 'Domain', hint: 'example.com' },
  { id: 'ip', label: 'IP', hint: '8.8.8.8' },
  { id: 'url', label: 'URL', hint: 'https://example.com/path' },
  { id: 'email', label: 'Email', hint: 'name@example.com' },
  { id: 'username', label: 'Username', hint: 'public handle' },
  { id: 'company', label: 'Company', hint: 'company name' },
  { id: 'github_repo', label: 'GitHub Repo', hint: 'owner/repo or GitHub URL' },
];

const CONNECTORS: Array<{ id: EnrichmentConnectorId; label: string; description: string; supported: OsintSeedType[] }> = [
  { id: 'dns', label: 'DNS', description: 'Google Public DNS-over-HTTPS records', supported: ['domain', 'url'] },
  { id: 'rdap', label: 'RDAP', description: 'Public domain registration metadata', supported: ['domain', 'url'] },
  { id: 'urlhaus', label: 'URLhaus', description: 'Public threat-intel metadata only', supported: ['domain', 'ip', 'url'] },
  { id: 'github', label: 'GitHub', description: 'Public repository metadata', supported: ['github_repo'] },
];

function SeverityBadge({ finding }: { finding: Finding }) {
  const tone = finding.severity === 'CRITICAL' || finding.severity === 'HIGH'
    ? 'border-red-500/40 bg-red-500/10 text-red-200'
    : finding.severity === 'MEDIUM'
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
      : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200';
  return <span className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${tone}`}>{finding.severity}</span>;
}

export function OsintView() {
  const {
    osintSeeds,
    findings,
    evidenceItems,
    enrichmentRuns,
    createOsintSeed,
    runEnrichment,
    promoteFindingToDetection,
  } = usePlatformStore();
  const [seedType, setSeedType] = useState<OsintSeedType>('domain');
  const [value, setValue] = useState('');
  const [selectedSeedId, setSelectedSeedId] = useState<string | null>(null);
  const [selectedConnectors, setSelectedConnectors] = useState<EnrichmentConnectorId[]>(['dns', 'rdap', 'urlhaus']);
  const [isRunning, setIsRunning] = useState(false);

  const selectedSeed = osintSeeds.find(seed => seed.id === selectedSeedId) || osintSeeds[0];
  const seedFindings = selectedSeed ? findings.filter(finding => finding.seedId === selectedSeed.id) : [];
  const latestRun = selectedSeed ? enrichmentRuns.find(run => run.seedId === selectedSeed.id) : null;
  const seedTypeHint = SEED_TYPES.find(type => type.id === seedType)?.hint;

  const compatibleConnectors = useMemo(() => CONNECTORS.filter(connector => connector.supported.includes(seedType)), [seedType]);

  const handleCreateAndRun = async () => {
    if (!value.trim()) return;
    const seedId = createOsintSeed(value, seedType);
    setSelectedSeedId(seedId);
    const connectors = selectedConnectors.filter(connector => CONNECTORS.find(item => item.id === connector)?.supported.includes(seedType));
    if (connectors.length === 0) return;
    setIsRunning(true);
    await runEnrichment(seedId, connectors);
    setIsRunning(false);
  };

  const toggleConnector = (connectorId: EnrichmentConnectorId) => {
    setSelectedConnectors(current => current.includes(connectorId)
      ? current.filter(id => id !== connectorId)
      : [...current, connectorId]
    );
  };

  return (
    <section className="flex h-full overflow-hidden bg-transparent">
      <aside className="w-[360px] shrink-0 overflow-y-auto border-r border-surface-700 bg-surface-900/70 p-5">
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">
            <FileSearch className="h-4 w-4" /> Live Public OSINT
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-50">OSINT Intake</h1>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Enter a seed, run safe public-source enrichment, create evidence-backed findings, and promote useful findings into detections.
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">
          <div className="mb-1 flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Boundary</div>
          Public metadata only. No credential collection, private scraping, exploit execution, or malware downloads.
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Seed Type</label>
          <select
            value={seedType}
            onChange={event => {
              const next = event.target.value as OsintSeedType;
              setSeedType(next);
              setSelectedConnectors(CONNECTORS.filter(connector => connector.supported.includes(next)).map(connector => connector.id));
            }}
            className="w-full rounded border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
          >
            {SEED_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
          </select>

          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Seed Value</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={value}
              onChange={event => setValue(event.target.value)}
              placeholder={seedTypeHint}
              className="w-full rounded border border-surface-700 bg-surface-900 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-cyan-500/60"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Enrichment Connectors</div>
            <div className="space-y-2">
              {CONNECTORS.map(connector => {
                const disabled = !connector.supported.includes(seedType);
                const checked = selectedConnectors.includes(connector.id) && !disabled;
                return (
                  <button
                    key={connector.id}
                    disabled={disabled}
                    onClick={() => toggleConnector(connector.id)}
                    className={`w-full rounded border p-3 text-left transition ${
                      disabled
                        ? 'cursor-not-allowed border-surface-800 bg-surface-900/40 text-slate-600'
                        : checked
                          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-100'
                          : 'border-surface-700 bg-surface-900 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{connector.label}</span>
                      {checked && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <p className="mt-1 text-[11px] leading-4 opacity-80">{connector.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleCreateAndRun}
            disabled={isRunning || !value.trim()}
            className="flex w-full items-center justify-center gap-2 rounded bg-cyan-500 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-surface-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
            Run Enrichment
          </button>
        </div>

        <div className="mt-6 border-t border-surface-700 pt-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Seeds</h2>
          <div className="space-y-2">
            {osintSeeds.map(seed => (
              <button
                key={seed.id}
                onClick={() => setSelectedSeedId(seed.id)}
                className={`w-full rounded border p-3 text-left text-sm transition ${selectedSeed?.id === seed.id ? 'border-cyan-500/40 bg-cyan-500/10' : 'border-surface-700 bg-surface-900 hover:border-slate-500'}`}
              >
                <div className="font-bold text-slate-100">{seed.value}</div>
                <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <span>{seed.type}</span>
                  <span>{seed.status}</span>
                </div>
              </button>
            ))}
            {osintSeeds.length === 0 && <div className="rounded border border-dashed border-surface-700 p-4 text-center text-xs text-slate-500">No OSINT seeds yet.</div>}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-50">Findings & Evidence</h2>
            <p className="mt-1 text-sm text-slate-400">{selectedSeed ? `Selected seed: ${selectedSeed.value}` : 'Create a seed to start live enrichment.'}</p>
          </div>
          {latestRun && (
            <div className="rounded border border-surface-700 bg-surface-900 px-4 py-3 text-xs">
              <div className="font-bold uppercase tracking-[0.16em] text-slate-400">Latest Run</div>
              <div className="mt-1 text-cyan-300">{latestRun.status} · {latestRun.findingIds.length} finding(s) · {latestRun.errors.length} error(s)</div>
            </div>
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {seedFindings.map(finding => {
            const evidence = evidenceItems.filter(item => finding.evidenceIds.includes(item.id));
            return (
              <article key={finding.id} className="rounded-xl border border-surface-700 bg-surface-900/80 p-5 shadow-xl shadow-black/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <SeverityBadge finding={finding} />
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">{finding.sourceType}</span>
                      <span className="rounded border border-surface-600 bg-surface-800 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">{finding.confidence}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-100">{finding.title}</h3>
                  </div>
                  <GitBranch className="h-5 w-5 shrink-0 text-slate-500" />
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-400">{finding.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {finding.entities.slice(0, 12).map(entity => (
                    <span key={entity} className="rounded border border-surface-600 bg-surface-800 px-2 py-1 text-[11px] font-mono text-amber-200">{entity}</span>
                  ))}
                </div>

                <div className="mt-5 border-t border-surface-700 pt-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-cyan-300" /> Evidence
                  </div>
                  <div className="space-y-2">
                    {evidence.map(item => (
                      <div key={item.id} className="rounded border border-surface-700 bg-surface-800/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs font-bold text-slate-200">{item.label}</div>
                          {item.sourceUrl && (
                            <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200"><ExternalLink className="h-3 w-3" /></a>
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">{item.sourceName} · {format(new Date(item.capturedAt), 'HH:mm:ss')} · reliability {item.sourceReliability}</div>
                        {item.rawSnippet && <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap rounded bg-surface-950 p-2 text-[10px] leading-4 text-slate-400">{item.rawSnippet}</pre>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    disabled={Boolean(finding.promotedDetectionId)}
                    onClick={() => promoteFindingToDetection(finding.id)}
                    className="rounded border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {finding.promotedDetectionId ? 'Promoted' : 'Promote to Detection'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {selectedSeed && seedFindings.length === 0 && (
          <div className="rounded-xl border border-dashed border-surface-700 bg-surface-900/50 p-10 text-center text-slate-500">
            No findings for this seed yet. Run compatible enrichment connectors.
          </div>
        )}

        {!selectedSeed && (
          <div className="rounded-xl border border-dashed border-surface-700 bg-surface-900/50 p-10 text-center text-slate-500">
            Create an OSINT seed to begin.
          </div>
        )}
      </main>
    </section>
  );
}
