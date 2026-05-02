// Core Domain Models

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Confidence = 'LOW' | 'MODERATE' | 'HIGH' | 'CONFIRMED';
export type WorkflowStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_ACTION' | 'RESOLVED' | 'CLOSED';

export interface FeedSignal {
  id: string;
  source: string; // e.g., 'NetworkSensor', 'API_Gateway', 'UserReport'
  timestamp: string;
  type: string; // e.g., 'LOGIN_ANOMALY', 'UNAUTHORIZED_ACCESS', 'DATA_EXFILTRATION'
  rawPayload: any; // The original log/event data
  priority: Priority;
  isProcessed: boolean;
}

export interface Entity {
  id: string;
  type: 'USER' | 'IP' | 'DEVICE' | 'FILE' | 'ENDPOINT';
  label: string;
  attributes: Record<string, any>;
}

export interface Detection {
  id: string;
  signalId: string;
  timestamp: string;
  title: string;
  description: string;
  confidence: Confidence;
  priority: Priority;
  relatedEntities: string[]; // Entity IDs
  workflowId?: string;
}

export interface WorkflowAction {
  id: string;
  label: string; // e.g., "Block IP", "Isolate Device", "Require MFA"
  description: string;
  type: 'MITIGATION' | 'INVESTIGATION' | 'ESCALATION';
  requiresApproval: boolean;
  isExecuted: boolean;
  executedAt?: string;
  executedBy?: string; // system or user
}

export interface WorkflowInvestigation {
  id: string;
  detectionId: string;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  assignee?: string;
  coursesOfAction: WorkflowAction[];
  notes: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: 'SYSTEM' | 'USER' | 'AI_ENGINE';
  actorId?: string;
  action: string; // e.g., 'PROMOTED_TO_DETECTION', 'EXECUTED_ACTION', 'WORKFLOW_CREATED'
  targetId: string; // ID of the entity/workflow/detection affected
  targetType: 'SIGNAL' | 'DETECTION' | 'WORKFLOW' | 'COA' | 'SYSTEM' | 'CONNECTOR';
  details: string;
}

// Graph Visualization Types
export interface GraphNode {
  id: string;
  group: number;
  label: string;
  val: number; // Size in graph
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
}

// System Connector Status
export interface Connector {
  id: string;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSync: string;
  type: 'INGRESS' | 'EGRESS' | 'INTEGRATION';
}

export type ConnectorAuthType = 'none' | 'apiKey' | 'oauth' | 'bearer' | 'basic' | 'unknown';
export type ConnectorCategory =
  | 'identity'
  | 'cloud'
  | 'endpoint'
  | 'security'
  | 'robotics'
  | 'workflow'
  | 'business'
  | 'maps'
  | 'custom';

export type ConnectorStatus = 'demo' | 'reference_only' | 'demo_template' | 'discovered' | 'configured' | 'active' | 'disabled' | 'error';

export interface ConnectorEndpoint {
  id: string;
  connectorId: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description?: string;
  authRequired: boolean;
  riskTags: string[];
  status: 'discovered' | 'disabled' | 'configured' | 'active' | 'error';
}

export interface DataConnector {
  id: string;
  name: string;
  category: ConnectorCategory;
  description: string;
  baseUrl?: string;
  specUrl?: string;
  authType: ConnectorAuthType;
  endpoints: ConnectorEndpoint[];
  status: ConnectorStatus;
  source: 'manual' | 'openapi' | 'public-api-catalog' | 'demo';
  truthStatus: 'demo_only' | 'reference_only' | 'requires_credentials' | 'verified_live';
}

export interface PublicSourceCandidate {
  id: string;
  name: string;
  description: string;
  category: ConnectorCategory;
  auth: ConnectorAuthType;
  https: boolean;
  cors: boolean | 'unknown';
  url: string;
  recommendedUse: 'feed' | 'enrichment' | 'workflow_action' | 'reference';
  status: 'reference_only' | 'demo_template';
}
