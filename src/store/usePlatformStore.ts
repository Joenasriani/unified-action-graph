import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { 
  FeedSignal, Detection, WorkflowInvestigation, 
  AuditLogEntry, GraphNode, GraphLink, Connector, WorkflowAction 
} from '../types';
import { generateDeterministicCOAs } from '../services/coaEngine';

interface PlatformState {
  signals: FeedSignal[];
  detections: Detection[];
  workflows: WorkflowInvestigation[];
  auditLogs: AuditLogEntry[];
  connectors: Connector[];
  
  // Graph Data
  nodes: GraphNode[];
  links: GraphLink[];

  // Actions
  promoteSignal: (signalId: string) => void;
  createWorkflow: (detectionId: string) => void;
  executeAction: (workflowId: string, actionId: string) => void;
  closeWorkflow: (workflowId: string, resolution: string) => void;
  
  // Internal logging
  addAuditLog: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
}

// --- SEED DATA ---
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

export const usePlatformStore = create<PlatformState>((set, get) => ({
  signals: SEED_SIGNALS,
  detections: [],
  workflows: [],
  auditLogs: [{
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actor: 'SYSTEM',
    action: 'SYSTEM_STARTUP',
    targetId: 'SYS',
    targetType: 'SYSTEM',
    details: 'Unified Action Graph engine initialized with 3 initial seed signals.'
  }],
  connectors: [
    { id: 'conn-1', name: 'Okta Identity', status: 'CONNECTED', lastSync: new Date().toISOString(), type: 'INGRESS' },
    { id: 'conn-2', name: 'AWS CloudTrail', status: 'CONNECTED', lastSync: new Date().toISOString(), type: 'INGRESS' },
    { id: 'conn-3', name: 'CrowdStrike Falcon', status: 'DISCONNECTED', lastSync: new Date(Date.now() - 86400000).toISOString(), type: 'INTEGRATION' },
  ],
  nodes: SEED_NODES,
  links: SEED_LINKS,

  addAuditLog: (log) => set(state => ({
    auditLogs: [{
      ...log,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    }, ...state.auditLogs]
  })),

  promoteSignal: (signalId: string) => {
    const { signals, addAuditLog, nodes, links } = get();
    const signal = signals.find(s => s.id === signalId);
    if (!signal || signal.isProcessed) return;

    // Create a new Detection
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

    // Update graph with rough entity extraction
    const newNodes = [...nodes];
    const newLinks = [...links];
    newDetection.relatedEntities.forEach(entity => {
      if (!newNodes.find(n => n.id === entity)) {
        newNodes.push({ id: entity, group: 5, label: entity, val: 5, color: '#f472b6' });
      }
      newLinks.push({ source: detectionId, target: entity, label: 'Involves' });
    });
    newNodes.push({ id: detectionId, group: 0, label: newDetection.title, val: 12, color: '#ef4444' });

    set(state => ({
      signals: state.signals.map(s => s.id === signalId ? { ...s, isProcessed: true } : s),
      detections: [newDetection, ...state.detections],
      nodes: newNodes,
      links: newLinks
    }));

    addAuditLog({
      actor: 'USER',
      action: 'PROMOTED_TO_DETECTION',
      targetId: detectionId,
      targetType: 'DETECTION',
      details: `User promoted signal ${signalId} to detection ${detectionId}`
    });
  },

  createWorkflow: (detectionId: string) => {
    const { detections, addAuditLog } = get();
    const detection = detections.find(d => d.id === detectionId);
    if (!detection || detection.workflowId) return;

    const workflowId = `wf-${uuidv4().substring(0, 8)}`;
    const coas = generateDeterministicCOAs(detection);

    const workflow: WorkflowInvestigation = {
      id: workflowId,
      detectionId,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      coursesOfAction: coas,
      notes: []
    };

    set(state => ({
      workflows: [workflow, ...state.workflows],
      detections: state.detections.map(d => d.id === detectionId ? { ...d, workflowId } : d)
    }));

    addAuditLog({
      actor: 'USER',
      action: 'WORKFLOW_CREATED',
      targetId: workflowId,
      targetType: 'WORKFLOW',
      details: `Created investigation workflow for detection ${detectionId}. Expected ${coas.length} potential COAs.`
    });
  },

  executeAction: (workflowId: string, actionId: string) => {
    const { addAuditLog } = get();
    
    set(state => ({
      workflows: state.workflows.map(wf => {
        if (wf.id !== workflowId) return wf;
        return {
          ...wf,
          updatedAt: new Date().toISOString(),
          status: 'IN_PROGRESS',
          coursesOfAction: wf.coursesOfAction.map(coa => 
            coa.id === actionId 
              ? { ...coa, isExecuted: true, executedAt: new Date().toISOString(), executedBy: 'current_user' }
              : coa
          )
        };
      })
    }));

    addAuditLog({
      actor: 'USER',
      action: 'EXECUTED_ACTION',
      targetId: actionId,
      targetType: 'COA',
      details: `Executed mitigation action ${actionId} in workflow ${workflowId}.`
    });
  },

  closeWorkflow: (workflowId: string, resolution: string) => {
    const { addAuditLog } = get();
    
    set(state => ({
      workflows: state.workflows.map(wf => 
        wf.id === workflowId 
          ? { ...wf, status: 'CLOSED', updatedAt: new Date().toISOString(), notes: [...wf.notes, `Resolution: ${resolution}`] }
          : wf
      )
    }));

    addAuditLog({
      actor: 'USER',
      action: 'WORKFLOW_CLOSED',
      targetId: workflowId,
      targetType: 'WORKFLOW',
      details: `Workflow closed with resolution: ${resolution}`
    });
  }
}));
