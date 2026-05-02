import { Detection, WorkflowAction } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Deterministic Engine for generating Courses of Action (COAs).
 * This acts as the scaffold for future LLM integration.
 */
export function generateDeterministicCOAs(detection: Detection): WorkflowAction[] {
  const coas: WorkflowAction[] = [];
  const type = detection.title.toUpperCase();

  // Baseline investigation action for everything
  coas.push({
    id: `coa-${uuidv4().substring(0, 8)}`,
    label: "Initiate Deep Forensic Scan",
    description: "Triggers a background forensic sweep of all entities associated with this detection.",
    type: "INVESTIGATION",
    requiresApproval: false,
    isExecuted: false,
  });

  if (type.includes('IMPOSSIBLE_TRAVEL') || type.includes('LOGIN')) {
    coas.push({
      id: `coa-${uuidv4().substring(0, 8)}`,
      label: "Force Password Reset & Terminate Sessions",
      description: "Invalidates all active tokens for the user and requires password reset on next login via Okta.",
      type: "MITIGATION",
      requiresApproval: true,
      isExecuted: false,
    });
    coas.push({
      id: `coa-${uuidv4().substring(0, 8)}`,
      label: "Require Step-Up Authentication (MFA)",
      description: "Require a hardware security key for the next 24 hours for this user.",
      type: "MITIGATION",
      requiresApproval: false,
      isExecuted: false,
    });
  }

  if (type.includes('PUBLIC_ACCESS') || type.includes('S3')) {
    coas.push({
      id: `coa-${uuidv4().substring(0, 8)}`,
      label: "Revoke Public Bucket Policy",
      description: "Applies 'Block Public Access' at the AWS account level for the affected resource.",
      type: "MITIGATION",
      requiresApproval: true,
      isExecuted: false,
    });
    coas.push({
      id: `coa-${uuidv4().substring(0, 8)}`,
      label: "Identify Exposed Data Assets",
      description: "Scan CloudTrail for GetObject actions against the bucket during the exposure window.",
      type: "INVESTIGATION",
      requiresApproval: false,
      isExecuted: false,
    });
  }
  
  if (type.includes('PORT_SCAN')) {
     coas.push({
      id: `coa-${uuidv4().substring(0, 8)}`,
      label: "Blackhole Source IP",
      description: "Add IP to the global ingress deny list on the edge firewall.",
      type: "MITIGATION",
      requiresApproval: true,
      isExecuted: false,
    });
  }

  return coas;
}
