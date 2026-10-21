export interface TriggeredHeuristic {
  name: string
  weight: number
  detail: string
  type: string
}

export interface ToolEvent {
  id: string
  block_height: number
  timestamp: string
  agent_id: string
  task_id: string | null
  tool: string
  action: string
  target: string
  args: Record<string, any>
  risk_score: number
  decision: 'ALLOW' | 'ASK' | 'BLOCK'
  reasons: TriggeredHeuristic[]
  explanation: string
  execution_status: 'blocked' | 'executed' | 'pending_approval' | 'rejected' | 'failed' | 'expired'
  execution_output: string | null
  hash: string
  prev_hash: string
}

export interface Policy {
  id: string
  name: string
  type: 'shell' | 'path' | 'sensitivity' | 'intent' | 'burst' | 'network' | 'custom'
  weight: number
  enabled: boolean
  description: string
  params: Record<string, any>
}

export interface Thresholds {
  allow_max: number
  ask_max: number
  block_min: number
}

export interface Approval {
  id: string
  event_id: string
  status: 'pending' | 'approved' | 'denied' | 'expired'
  decided_by: string | null
  decided_at: string | null
  expires_at: string
  reason: string | null
  event_summary?: {
    tool: string
    action: string
    target: string
    risk_score: number
    explanation: string
    agent_id: string
    timestamp: string
  }
}

export interface Incident {
  id: string
  title: string
  agent_id: string
  severity: number
  status: 'active' | 'investigating' | 'mitigated'
  created_at: string
  event_ids: string[]
  blast_radius_summary: string | null
}

export interface RiskTimePoint {
  time: string
  score: number
  decision: 'ALLOW' | 'ASK' | 'BLOCK'
  target: string
}

export interface DecisionMix {
  allow_pct: number
  ask_pct: number
  block_pct: number
  allow_count: number
  ask_count: number
  block_count: number
}

export interface StatsSummary {
  total_inspected: number
  human_interventions: number
  hard_blocks: number
  avg_overhead_ms: number
  active_agents: number
  decision_mix: DecisionMix
  risk_over_time: RiskTimePoint[]
}

export interface AuditVerifyResponse {
  valid: boolean
  total_blocks: number
  genesis_hash: string
  head_hash: string
  tampered_blocks: number[]
  verified_at: string
}

export interface EvaluationRequest {
  agent_id: string
  task_id?: string
  tool: string
  action: string
  target: string
  args?: Record<string, any>
  stated_intent?: string
  workspace_root?: string
}

export interface EvaluationResponse {
  event_id: string
  decision: 'ALLOW' | 'ASK' | 'BLOCK'
  risk_score: number
  reasons: TriggeredHeuristic[]
  explanation: string
  approval_id?: string
  execution_output?: string
  hash: string
  block_height: number
  latency_ms: number
}
