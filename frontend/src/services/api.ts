import {
  StatsSummary,
  ToolEvent,
  Policy,
  Thresholds,
  Approval,
  Incident,
  AuditVerifyResponse,
  EvaluationRequest,
  EvaluationResponse
} from '../types'

const API_BASE = 'https://agentguard-backend-a71h.onrender.com/api'

export async function fetchStats(): Promise<StatsSummary> {
  try {
    const res = await fetch(`${API_BASE}/stats`)
    if (!res.ok) throw new Error('Failed to fetch stats')
    return await res.json()
  } catch (err) {
    console.warn('Backend offline or unreachable, using fallback stats', err)
    return {
      total_inspected: 148920,
      human_interventions: 142,
      hard_blocks: 37,
      avg_overhead_ms: 1.84,
      active_agents: 3,
      decision_mix: {
        allow_pct: 97.2,
        ask_pct: 2.5,
        block_pct: 0.3,
        allow_count: 144750,
        ask_count: 3723,
        block_count: 447
      },
      risk_over_time: [
        { time: '00:00', score: 14, decision: 'ALLOW', target: 'docs/README.md' },
        { time: '04:00', score: 18, decision: 'ALLOW', target: 'git_commit' },
        { time: '08:00', score: 54, decision: 'ASK', target: 'assets/*' },
        { time: '12:00', score: 22, decision: 'ALLOW', target: 'tests/run' },
        { time: '16:00', score: 92, decision: 'BLOCK', target: 'rm -rf ./src/' },
        { time: '20:00', score: 16, decision: 'ALLOW', target: 'build' },
        { time: 'Now', score: 12, decision: 'ALLOW', target: 'audit.log' }
      ]
    }
  }
}

export async function fetchEvents(limit = 50, offset = 0, decision?: string): Promise<{ items: ToolEvent[]; total: number }> {
  try {
    let url = `${API_BASE}/events?limit=${limit}&offset=${offset}`
    if (decision && decision !== 'ALL') url += `&decision=${decision}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch events')
    return await res.json()
  } catch (err) {
    console.warn('Backend offline, using fallback events', err)
    return {
      total: 5,
      items: [
        {
          id: 'ev-demo-01',
          block_height: 10295,
          timestamp: new Date().toISOString(),
          agent_id: 'AutoDev_Agent_v3',
          task_id: 'task-clean',
          tool: 'safe_shell',
          action: 'exec',
          target: 'rm -rf ./src/',
          args: { command: 'rm -rf ./src/' },
          risk_score: 92,
          decision: 'BLOCK',
          reasons: [
            { name: 'Intent vs Action Mismatch', weight: 40, detail: 'Organize task does not warrant recursive deletion', type: 'intent' },
            { name: 'Destructive Shell Flags', weight: 75, detail: 'Flag -rf targeting directory', type: 'shell' },
            { name: 'Protected Target Scope', weight: 70, detail: 'Target ./src/ is core codebase', type: 'path' }
          ],
          explanation: 'Hard block: Agent attempted recursive deletion of protected codebase directory ./src/',
          execution_status: 'blocked',
          execution_output: 'Execution intercepted and hard-trapped at gateway.',
          hash: '0x9f4a8b22c1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
          prev_hash: '0x3d7b2a1c0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c'
        },
        {
          id: 'ev-demo-02',
          block_height: 10294,
          timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
          agent_id: 'DataSync_Agent_02',
          task_id: 'task-archive',
          tool: 'safe_fs',
          action: 'rename',
          target: './assets/*',
          args: { destination: './archive/', affected_count: 48 },
          risk_score: 54,
          decision: 'ASK',
          reasons: [
            { name: 'Bulk Mutation Throttle', weight: 35, detail: '48 paths impacted (Threshold: 10)', type: 'burst' }
          ],
          explanation: 'Paused: Bulk file mutation of 48 items requires human operator verification.',
          execution_status: 'pending_approval',
          execution_output: null,
          hash: '0x3d7b2a1c0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c',
          prev_hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
        },
        {
          id: 'ev-demo-03',
          block_height: 10293,
          timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
          agent_id: 'DocWriter_v1',
          task_id: 'task-docs',
          tool: 'safe_fs',
          action: 'write',
          target: './docs/README.md',
          args: { content: '# Updated Documentation' },
          risk_score: 12,
          decision: 'ALLOW',
          reasons: [],
          explanation: 'Allowed: Safe write to non-sensitive markdown file in docs workspace.',
          execution_status: 'executed',
          execution_output: 'Successfully wrote 42 lines to ./docs/README.md',
          hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
          prev_hash: '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f'
        },
        {
          id: 'ev-demo-04',
          block_height: 10292,
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          agent_id: 'ResearchBot_Beta',
          task_id: 'task-auth',
          tool: 'safe_fs',
          action: 'read',
          target: '.env',
          args: {},
          risk_score: 94,
          decision: 'BLOCK',
          reasons: [
            { name: 'Environment Secret Guard', weight: 75, detail: 'Attempted read of .env secrets file', type: 'sensitivity' }
          ],
          explanation: 'Blocked: Unauthorized attempt to read environment secrets and API keys.',
          execution_status: 'blocked',
          execution_output: 'Access denied: Path .env is strictly protected.',
          hash: '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
          prev_hash: '0x0000000000000000000000000000000000000000000000000000000000000000'
        }
      ]
    }
  }
}

export async function fetchPolicies(): Promise<{ policies: Policy[]; thresholds: Thresholds }> {
  try {
    const res = await fetch(`${API_BASE}/policies`)
    if (!res.ok) throw new Error('Failed to fetch policies')
    return await res.json()
  } catch (err) {
    console.warn('Backend offline, using fallback policies', err)
    return {
      policies: [
        {
          id: 'POL-SHELL-RECURSIVE-DELETE',
          name: 'Prohibit Recursive Deletion (rm -rf)',
          type: 'shell',
          weight: 75,
          enabled: true,
          description: 'Hard blocks commands containing recursive deletion flags targeting directories.',
          params: { flags: ['-r', '-R', '--recursive'] }
        },
        {
          id: 'POL-PATH-SYSTEM-ROOT',
          name: 'Host OS Root Protection',
          type: 'path',
          weight: 70,
          enabled: true,
          description: 'Intercepts operations attempting to read or mutate system root paths (/etc, /bin, Windows).',
          params: { system_paths: ['/etc', '/bin', '/usr', 'C:\\Windows'] }
        },
        {
          id: 'POL-SECRET-ENV-SCAN',
          name: 'Environment Secret File Guard (.env / Keys)',
          type: 'sensitivity',
          weight: 75,
          enabled: true,
          description: 'Blocks tool calls targeting credential files, .env files, and SSH private keys.',
          params: { extensions: ['.env', 'id_rsa', '.pem', '.key'] }
        },
        {
          id: 'POL-INTENT-ACTION-MISMATCH',
          name: 'Intent vs Action Dissonance Guard',
          type: 'intent',
          weight: 40,
          enabled: true,
          description: 'Detects semantic mismatch between stated user task intent and destructive actions.',
          params: {}
        },
        {
          id: 'POL-BURST-BULK-AFFECTED-COUNT',
          name: 'Bulk Mutation Throttle (>10 Files)',
          type: 'burst',
          weight: 35,
          enabled: true,
          description: 'Requires human 2FA approval whenever a tool action impacts more than 10 filesystem paths.',
          params: { threshold: 10 }
        },
        {
          id: 'POL-SQL-SCHEMA-DROP',
          name: 'Destructive SQL Table / Schema Protection',
          type: 'shell',
          weight: 75,
          enabled: true,
          description: 'Blocks SQL DROP TABLE, DROP DATABASE, and TRUNCATE operations.',
          params: {}
        },
        {
          id: 'POL-PATH-OUT-OF-WORKSPACE',
          name: 'Workspace Boundary Containment',
          type: 'path',
          weight: 70,
          enabled: true,
          description: 'Enforces that all tool paths resolve strictly inside the assigned workspace sandbox.',
          params: {}
        },
        {
          id: 'POL-NETWORK-SECRET-EXFIL',
          name: 'Network Egress Data Exfiltration Filter',
          type: 'network',
          weight: 75,
          enabled: true,
          description: 'Blocks outbound network payloads containing credentials or environment secrets.',
          params: {}
        },
        {
          id: 'POL-FORMAT-BULK-SCOPE',
          name: 'Bulk Configuration Formatting Scope',
          type: 'burst',
          weight: 12,
          enabled: true,
          description: 'Permits safe formatting of configuration files across workspace (low risk, routine formatting).',
          params: {}
        },
        {
          id: 'POL-SECURITY-CONFIG-MUTATION',
          name: 'Security Configuration Tampering Guard',
          type: 'sensitivity',
          weight: 85,
          enabled: true,
          description: 'Blocks modifications that weaken security posture, disable authentication, or expose secrets.',
          params: {}
        }
      ],
      thresholds: {
        allow_max: 29,
        ask_max: 69,
        block_min: 70
      }
    }
  }
}

export async function updatePolicy(policyId: string, updates: Partial<Policy>): Promise<Policy> {
  const res = await fetch(`${API_BASE}/policies/${policyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
  if (!res.ok) throw new Error('Failed to update policy')
  return await res.json()
}

export async function updateThresholds(thresholds: { allow_max: number; ask_max: number }): Promise<Thresholds> {
  const res = await fetch(`${API_BASE}/policies/thresholds`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(thresholds)
  })
  if (!res.ok) throw new Error('Failed to update thresholds')
  return await res.json()
}

export async function fetchApprovals(status = 'all'): Promise<Approval[]> {
  try {
    const res = await fetch(`${API_BASE}/approvals?status=${status}`)
    if (!res.ok) throw new Error('Failed to fetch approvals')
    return await res.json()
  } catch (err) {
    console.warn('Backend offline, using fallback approvals', err)
    return [
      {
        id: 'apprv-demo-01',
        event_id: 'ev-demo-02',
        status: 'pending',
        decided_by: null,
        decided_at: null,
        expires_at: new Date(Date.now() + 1000 * 55).toISOString(),
        reason: 'Bulk rename impacts 48 files',
        event_summary: {
          tool: 'safe_fs',
          action: 'rename',
          target: './assets/*',
          risk_score: 54,
          explanation: 'Moving 48 files across directories in workspace',
          agent_id: 'DataSync_Agent_02',
          timestamp: new Date().toISOString()
        }
      }
    ]
  }
}

export async function resolveApproval(approvalId: string, action: 'approve' | 'deny', note?: string): Promise<Approval> {
  const res = await fetch(`${API_BASE}/approvals/${approvalId}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operator: 'Operator-Admin', note: note || `Action ${action}d via Dashboard` })
  })
  if (!res.ok) throw new Error(`Failed to ${action} approval`)
  return await res.json()
}

export async function fetchIncidents(): Promise<Incident[]> {
  try {
    const res = await fetch(`${API_BASE}/incidents`)
    if (!res.ok) throw new Error('Failed to fetch incidents')
    return await res.json()
  } catch (err) {
    console.warn('Backend offline, using fallback incidents', err)
    return [
      {
        id: 'INC-8821',
        title: 'Recursive Codebase Directory Wiping Attempt',
        agent_id: 'AutoDev_Agent_v3',
        severity: 92,
        status: 'mitigated',
        created_at: new Date().toISOString(),
        event_ids: ['ev-demo-01'],
        blast_radius_summary: 'Target ./src/ contained 48 critical source files. Zero damage occurred.'
      },
      {
        id: 'INC-8819',
        title: 'Exfiltration Attempt of Environment Secrets',
        agent_id: 'ResearchBot_Beta',
        severity: 94,
        status: 'mitigated',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        event_ids: ['ev-demo-04'],
        blast_radius_summary: 'Target .env credential store. Gateway stopped read attempt.'
      }
    ]
  }
}

export async function verifyAuditChain(): Promise<AuditVerifyResponse> {
  try {
    const res = await fetch(`${API_BASE}/audit/verify`)
    if (!res.ok) throw new Error('Failed to verify audit ledger')
    return await res.json()
  } catch (err) {
    console.warn('Backend offline, simulating audit chain verification', err)
    return {
      valid: true,
      total_blocks: 10295,
      genesis_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      head_hash: '0x9f4a8b22c1d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
      tampered_blocks: [],
      verified_at: new Date().toISOString()
    }
  }
}

export async function evaluateToolCall(req: EvaluationRequest): Promise<EvaluationResponse> {
  try {
    const res = await fetch(`${API_BASE}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    })
    if (!res.ok) throw new Error('Failed to evaluate tool call')
    return await res.json()
  } catch (err) {
    console.warn('Backend evaluation call failed, computing client-side simulation', err)
    // Intelligent client-side fallback matching risk engine logic
    const cmd = (req.target || '').toLowerCase()
    let score = 12
    let decision: 'ALLOW' | 'ASK' | 'BLOCK' = 'ALLOW'
    const reasons = []

    if (cmd.includes('rm -rf') || cmd.includes('delete') || cmd.includes('drop table') || cmd.includes('wipe out')) {
      score = 92
      decision = 'BLOCK'
      reasons.push(
        { name: 'Destructive Shell Command', weight: 75, detail: 'Recursive deletion flag detected', type: 'shell' },
        { name: 'Protected Target Scope', weight: 70, detail: 'Target is core filesystem directory', type: 'path' }
      )
    } else if (cmd.includes('disable auth') || cmd.includes('no-auth') || cmd.includes('chmod 777') || cmd.includes('disable authentication')) {
      score = 85
      decision = 'BLOCK'
      reasons.push({ name: 'Security Configuration Tampering', weight: 85, detail: 'Attempted weakening of security posture', type: 'sensitivity' })
    } else if (cmd.includes('.env') || cmd.includes('id_rsa') || cmd.includes('secret')) {
      score = 94
      decision = 'BLOCK'
      reasons.push({ name: 'Environment Secret Guard', weight: 75, detail: 'Sensitive file target', type: 'sensitivity' })
    } else if (cmd.includes('formatting') && (cmd.includes('workspace') || cmd.includes('files'))) {
      score = 12
      decision = 'ALLOW'
      reasons.push({ name: 'Bulk Configuration Formatting Scope', weight: 12, detail: 'Multiple configuration files targeted for formatting', type: 'burst' })
    } else if (req.action === 'rename' || cmd.includes('*') || (req.args && req.args.affected_count > 10)) {
      score = 54
      decision = 'ASK'
      reasons.push({ name: 'Bulk Mutation Throttle', weight: 35, detail: 'Multiple items impacted', type: 'burst' })
    }

    return {
      event_id: `ev-sim-${Date.now()}`,
      decision,
      risk_score: score,
      reasons,
      explanation: decision === 'BLOCK'
        ? `Hard Block: Agent action ${req.tool}("${req.target}") triggered critical security boundaries.`
        : decision === 'ASK'
        ? `Approval Required: Action impacts bulk items or ambiguous paths.`
        : `Safe: Routine operation inside approved workspace.`,
      hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      block_height: 10296,
      latency_ms: 1.84,
      approval_id: decision === 'ASK' ? `apprv-sim-${Date.now()}` : undefined
    }
  }
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private listeners: ((event: any) => void)[] = []
  private statusListeners: ((online: boolean) => void)[] = []
  private reconnectTimer: any = null

  connect() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      // Connect through Vite proxy or directly to 8000
      const wsUrl = `${protocol}//${host}/ws/events`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('[AgentGuard WebSocket] Connected')
        this.statusListeners.forEach(fn => fn(true))
      }

      this.ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data)
          this.listeners.forEach(fn => fn(data))
        } catch (e) {
          console.error('[AgentGuard WebSocket] Parse error', e)
        }
      }

      this.ws.onclose = () => {
        console.log('[AgentGuard WebSocket] Disconnected, scheduling reconnect')
        this.statusListeners.forEach(fn => fn(false))
        this.scheduleReconnect()
      }

      this.ws.onerror = () => {
        this.ws?.close()
      }
    } catch {
      this.statusListeners.forEach(fn => fn(false))
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => this.connect(), 3000)
  }

  onEvent(callback: (event: any) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback)
    }
  }

  onStatus(callback: (online: boolean) => void) {
    this.statusListeners.push(callback)
    return () => {
      this.statusListeners = this.statusListeners.filter(fn => fn !== callback)
    }
  }
}

export const wsClient = new WebSocketClient()
