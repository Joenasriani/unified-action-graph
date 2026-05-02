import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  FeedSignal, Detection, WorkflowInvestigation, 
  AuditLogEntry, GraphNode, GraphLink, Connector,
  OsintSeed, OsintSeedType, Finding, EvidenceItem,
  EnrichmentRun, EnrichmentConnectorId, EnrichmentConnectorResponse, EnrichmentFindingPayload
} from '../types';
import { generateDeterministicCOAs } from '../services/coaEngine';

interface PlatformState {
  signals: FeedSignal[];
  detections: Detection[];
  workflows: WorkflowInvestigation[];
  auditLogs: AuditLogEntry[];
  connectors: Connector[];
  osintSeeds: OsintSeed[];
  findings: Finding[];
  evidenceItems: EvidenceItem[];
  enrichmentRuns: EnrichmentRun[];
  nodes: GraphNode[];
  links: GraphLink[];

  promoteSignal: (signalId: string) => void;
  createWorkflow: (detectionId: string) => void;
  executeAction: (workflowId: string, actionId: string) => void;
  closeWorkflow: (workflowId: string, resolution: string) => void;
  createOsintSeed: (value: string, type: OsintSeedType) => string;
  runEnrichment: (seedId: string, connectors: EnrichmentConnectorId[]) => Promise<void>;
  promoteFindingToDetection: (findingId: string) => void;
  addAuditLog: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
}

const SEED_SIGNALS: FeedSignal[] = [
  {
    id: 'sig-001',
    source: 'Firewall-East',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    type: 'PORT_SCAN',
    rawPayload: { ip_src: '192.168.1.105', ports: [22, 80, 443, 8080, 3389] },
    priority: 'LOW',
    isProcessed: false,
  },
  {
    id: 'sig-002',
    source: 'Okta-Integration',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    type: 'IMPOSSIBLE_TRAVEL',
    rawPayload: { user: 'jsmith@company.com', geo1: 'US-NY', geo2: 'CN-BJ', delta_mins: 15 },
    priority: 'CRITICAL',
    isProcessed: false,
  },
  {
    id: 'sig-003',
    source: 'AWS-CloudTrail',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    type: 'S3_BUCKET_PUBLIC_ACCESS',
    rawPayload: { bucket: 'prod-db-backups-2026', actor: 'arn:aws:iam::123:role/dev' },
    priority: 'HIGH',
    isProcessed: false,
  }
];

const SEED_NODES: GraphNode[] = [
  { id: '192.168.1.105', group: 1, label: '192.168.1.105', val: 10, color: '#f87171' },
  { id: 'jsmith@company.com', group: 2, label: 'jsmith@company.com', val: 15, color: '#38bdf8' },
  { id: 'prod-db-backups-2026', group: 3, label: 'prod-db-backups-2026', val: 20, color: '#fbbf24' },
  { id: 'US-NY-Gateway', group: 4, label: 'US-NY Gateway', val: 8, color: '#94a3b8' },
  { id: 'CN-BJ-Gateway', group: 4, label: 'CN-BJ Gateway', val: 8, color: '#94a3b8' },
];

const SEED_LINKS: GraphLink[] = [
  { source: 'jsmith@company.com', target: 'US-NY-Gateway', label: 'Login' },
  { source: 'jsmith@company.com', target: 'CN-BJ-Gateway', label: 'Login' },
];

function severityToPriority(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (severity === 'CRITICAL') return 'CRITICAL';
  if (severity === 'HIGH') return 'HIGH';
  if (severity === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function connectorAllowedForSeed(connector: EnrichmentConnectorId, seedType: OsintSeedType) {
  if (connector === 'dns' || connector === 'rdap') return seedType === 'domain' || seedType === 'url';
  if (connector === 'urlhaus') return seedType === 'domain' || seedType === 'ip' || seedType === 'url';
  if (connector === 'github') return seedType === 'github_repo';
  return false;
}

export const usePlatformStore = create<PlatformState>((set, get) => ({
  signals: SEED_SIGNALS,
  detections: [],
  workflows: [],
  osintSeeds: [],
  findings: [],
  evidenceItems: [],
  enrichmentRuns: [],
  auditLogs: [{
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actor: 'SYSTEM',
    action: 'SYSTEM_STARTUP',
    targetId: 'SYS',
    targetType: 'SYSTEM',
    details: 'Unified Action Graph engine initialized with demo seed signals and live OSINT enrichment routes.'
  }],
  connectors: [
    { id: 'conn-1', name: 'Okta Identity', status: 'CONNECTED', lastSync: new Date().toISOString(), type: 'INGRESS' },
    { id: 'conn-2', name: 'AWS CloudTrail', status: 'CONNECTED', lastSync: new Date().toISOString(), type: 'INGRESS' },
    { id: 'conn-3', name: 'CrowdStrike Falcon', status: 'DISCONNECTED', lastSync: new Date(Date.now() - 86400000).toISOString(), type: 'INTEGRATION' },
  ],
  nodes: SEED_NODES,
  links: SEED_LINKS,

  addAuditLog: (log) => set(state => ({
    auditLogs: [{ ...log, id: uuidv4(), timestamp: new Date().toISOString() }, ...state.auditLogs]
  })),

  createOsintSeed: (value, type) => {
    const normalized = value.trim();
    const seedId = `seed-${uuidv4().substring(0, 8)}`;
    const seed: OsintSeed = {
      id: seedId,
      value: normalized,
      type,
      createdAt: new Date().toISOString(),
      status: 'draft',
      truthStatus: 'live_public_source',
      findingIds: [],
    };
    set(state => ({
      osintSeeds: [seed, ...state.osintSeeds],
      nodes: [{ id: seedId, group: 6, label: normalized, val: 14, color: '#22d3ee' }, ...state.nodes]
    }));
    get().addAuditLog({ actor: 'USER', action: 'OSINT_SEED_CREATED', targetId: seedId, targetType: 'OSINT_SEED', details: `Created OSINT seed ${normalized} (${type}).` });
    return seedId;
  },

  runEnrichment: async (seedId, connectors) => {
    const seed = get().osintSeeds.find(s => s.id === seedId);
    if (!seed) return;

    const allowed = connectors.filter(connector => connectorAllowedForSeed(connector, seed.type));
    const runId = `enrich-${uuidv4().substring(0, 8)}`;
    const run: EnrichmentRun = {
      id: runId,
      seedId,
      connectors: allowed,
      status: 'running',
      startedAt: new Date().toISOString(),
      findingIds: [],
      evidenceIds: [],
      errors: [],
    };

    set(state => ({
      enrichmentRuns: [run, ...state.enrichmentRuns],
      osintSeeds: state.osintSeeds.map(s => s.id === seedId ? { ...s, status: 'queued' } : s)
    }));
    get().addAuditLog({ actor: 'SYSTEM', action: 'ENRICHMENT_RUN_STARTED', targetId: runId, targetType: 'ENRICHMENT_RUN', details: `Started OSINT enrichment for ${seed.value} using ${allowed.join(', ') || 'no compatible connectors'}.` });

    const allFindings: Finding[] = [];
    const allEvidence: EvidenceItem[] = [];
    const errors: string[] = [];

    for (const connector of allowed) {
      try {
        const response = await fetch(`/api/enrich/${connector}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: seed.value, type: seed.type }),
        });
        const payload = await response.json() as EnrichmentConnectorResponse;
        if (payload.errors?.length) errors.push(...payload.errors.map(error => `${connector}: ${error}`));

        payload.findings.forEach((item: EnrichmentFindingPayload) => {
          const findingId = `finding-${uuidv4().substring(0, 8)}`;
          const evidenceIds: string[] = [];
          item.evidence.forEach(evidence => {
            const evidenceId = `evidence-${uuidv4().substring(0, 8)}`;
            evidenceIds.push(evidenceId);
            allEvidence.push({
              id: evidenceId,
              findingId,
              label: evidence.label,
              sourceName: evidence.sourceName,
              sourceUrl: evidence.sourceUrl,
              rawSnippet: evidence.rawSnippet,
              capturedAt: new Date().toISOString(),
              sourceReliability: evidence.sourceReliability,
            });
          });

          allFindings.push({
            id: findingId,
            seedId,
            title: item.title,
            description: item.description,
            sourceType: item.sourceType,
            sourceUrl: item.sourceUrl,
            confidence: item.confidence,
            severity: item.severity,
            entities: item.entities,
            evidenceIds,
            createdAt: new Date().toISOString(),
          });
        });
      } catch (error) {
        errors.push(`${connector}: ${error instanceof Error ? error.message : 'Unknown enrichment error'}`);
      }
    }

    const findingIds = allFindings.map(f => f.id);
    const evidenceIds = allEvidence.map(e => e.id);
    const newNodes: GraphNode[] = [];
    const newLinks: GraphLink[] = [];

    allFindings.forEach(finding => {
      newNodes.push({ id: finding.id, group: 7, label: finding.title, val: 12, color: finding.severity === 'HIGH' || finding.severity === 'CRITICAL' ? '#ef4444' : '#a78bfa' });
      newLinks.push({ source: seedId, target: finding.id, label: 'Produced finding' });
      finding.entities.slice(0, 20).forEach(entity => {
        if (entity.length > 0) {
          newNodes.push({ id: entity, group: 8, label: entity, val: 6, color: '#fbbf24' });
          newLinks.push({ source: finding.id, target: entity, label: 'Entity' });
        }
      });
      finding.evidenceIds.forEach(evidenceId => {
        newNodes.push({ id: evidenceId, group: 9, label: 'Evidence', val: 4, color: '#94a3b8' });
        newLinks.push({ source: finding.id, target: evidenceId, label: 'Evidence' });
      });
    });

    set(state => ({
      findings: [...allFindings, ...state.findings],
      evidenceItems: [...allEvidence, ...state.evidenceItems],
      enrichmentRuns: state.enrichmentRuns.map(r => r.id === runId ? { ...r, status: errors.length && allFindings.length ? 'partial' : errors.length ? 'error' : 'completed', completedAt: new Date().toISOString(), findingIds, evidenceIds, errors } : r),
      osintSeeds: state.osintSeeds.map(s => s.id === seedId ? { ...s, status: errors.length && allFindings.length ? 'partial' : errors.length ? 'error' : 'enriched_live', findingIds: [...findingIds, ...s.findingIds] } : s),
      nodes: [...newNodes.filter(n => !state.nodes.find(existing => existing.id === n.id)), ...state.nodes],
      links: [...newLinks, ...state.links],
    }));

    get().addAuditLog({ actor: 'SYSTEM', action: 'ENRICHMENT_RUN_COMPLETED', targetId: runId, targetType: 'ENRICHMENT_RUN', details: `Completed OSINT enrichment for ${seed.value}: ${findingIds.length} finding(s), ${evidenceIds.length} evidence item(s), ${errors.length} error(s).` });
  },

  promoteFindingToDetection: (findingId) => {
    const { findings, addAuditLog, nodes, links } = get();
    const finding = findings.find(f => f.id === findingId);
    if (!finding || finding.promotedDetectionId) return;

    const detectionId = `det-${uuidv4().substring(0, 8)}`;
    const detection: Detection = {
      id: detectionId,
      signalId: finding.id,
      timestamp: new Date().toISOString(),
      title: `OSINT Finding: ${finding.title}`,
      description: finding.description,
      confidence: finding.confidence,
      priority: severityToPriority(finding.severity),
      relatedEntities: finding.entities,
    };

    set(state => ({
      detections: [detection, ...state.detections],
      findings: state.findings.map(f => f.id === findingId ? { ...f, promotedDetectionId: detectionId } : f),
      nodes: [{ id: detectionId, group: 0, label: detection.title, val: 12, color: '#ef4444' }, ...nodes],
      links: [{ source: findingId, target: detectionId, label: 'Promoted to detection' }, ...links],
    }));

    addAuditLog({ actor: 'USER', action: 'FINDING_PROMOTED_TO_DETECTION', targetId: detectionId, targetType: 'DETECTION', details: `Promoted OSINT finding ${findingId} into detection ${detectionId}.` });
  },

  promoteSignal: (signalId: string) => {
    const { signals, addAuditLog, nodes, links } = get();
    const signal = signals.find(s => s.id === signalId);
    if (!signal || signal.isProcessed) return;

    const detectionId = `det-${uuidv4().substring(0, 8)}`;
    const newDetection: Detection = {
      id: detectionId,
      signalId: signal.id,
      timestamp: new Date().toISOString(),
      title: `Generated Detection: ${signal.type}`,
      description: `Automated detection generated from ${signal.source} signal.`,
      confidence: 'HIGH',
      priority: signal.priority,
      relatedEntities: Object.values(signal.rawPayload).map(v => String(v)).filter(v => v.length < 50),
    };

    const newNodes = [...nodes];
    const newLinks = [...links];
    newDetection.relatedEntities.forEach(entity => {
      if (!newNodes.find(n => n.id === entity)) newNodes.push({ id: entity, group: 5, label: entity, val: 5, color: '#f472b6' });
      newLinks.push({ source: detectionId, target: entity, label: 'Involves' });
    });
    newNodes.push({ id: detectionId, group: 0, label: newDetection.title, val: 12, color: '#ef4444' });

    set(state => ({
      signals: state.signals.map(s => s.id === signalId ? { ...s, isProcessed: true } : s),
      detections: [newDetection, ...state.detections],
      nodes: newNodes,
      links: newLinks
    }));

    addAuditLog({ actor: 'USER', action: 'PROMOTED_TO_DETECTION', targetId: detectionId, targetType: 'DETECTION', details: `User promoted signal ${signalId} to detection ${detectionId}` });
  },

  createWorkflow: (detectionId: string) => {
    const { detections, addAuditLog } = get();
    const detection = detections.find(d => d.id === detectionId);
    if (!detection || detection.workflowId) return;

    const workflowId = `wf-${uuidv4().substring(0, 8)}`;
    const coas = generateDeterministicCOAs(detection);
    const workflow: WorkflowInvestigation = { id: workflowId, detectionId, status: 'OPEN', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), coursesOfAction: coas, notes: [] };

    set(state => ({ workflows: [workflow, ...state.workflows], detections: state.detections.map(d => d.id === detectionId ? { ...d, workflowId } : d) }));
    addAuditLog({ actor: 'USER', action: 'WORKFLOW_CREATED', targetId: workflowId, targetType: 'WORKFLOW', details: `Created investigation workflow for detection ${detectionId}. Expected ${coas.length} potential COAs.` });
  },

  executeAction: (workflowId: string, actionId: string) => {
    const { addAuditLog } = get();
    set(state => ({
      workflows: state.workflows.map(wf => wf.id !== workflowId ? wf : {
        ...wf,
        updatedAt: new Date().toISOString(),
        status: 'IN_PROGRESS',
        coursesOfAction: wf.coursesOfAction.map(coa => coa.id === actionId ? { ...coa, isExecuted: true, executedAt: new Date().toISOString(), executedBy: 'current_user' } : coa)
      })
    }));
    addAuditLog({ actor: 'USER', action: 'EXECUTED_ACTION', targetId: actionId, targetType: 'COA', details: `Executed mitigation action ${actionId} in workflow ${workflowId}.` });
  },

  closeWorkflow: (workflowId: string, resolution: string) => {
    const { addAuditLog } = get();
    set(state => ({ workflows: state.workflows.map(wf => wf.id === workflowId ? { ...wf, status: 'CLOSED', updatedAt: new Date().toISOString(), notes: [...wf.notes, `Resolution: ${resolution}`] } : wf) }));
    addAuditLog({ actor: 'USER', action: 'WORKFLOW_CLOSED', targetId: workflowId, targetType: 'WORKFLOW', details: `Workflow closed with resolution: ${resolution}` });
  }
}));
