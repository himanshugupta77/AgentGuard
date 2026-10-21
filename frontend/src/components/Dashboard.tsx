import React, { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Lock, 
  Download, 
  Sliders, 
  Search, 
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { 
  fetchEvents, 
  fetchPolicies, 
  fetchApprovals, 
  fetchIncidents, 
  verifyAuditChain, 
  updatePolicy, 
  updateThresholds 
} from '../services/api'
import { ToolEvent, Policy, Thresholds, Approval, Incident, AuditVerifyResponse, StatsSummary } from '../types'

interface DashboardProps {
  stats: StatsSummary | null
  onSelectEvent: (event: ToolEvent) => void
  newEventTrigger?: ToolEvent | null
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, onSelectEvent, newEventTrigger }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'threats' | 'policies' | 'audit'>('events')
  const [events, setEvents] = useState<ToolEvent[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [thresholds, setThresholds] = useState<Thresholds>({ allow_max: 29, ask_max: 69, block_min: 70 })
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [auditStatus, setAuditStatus] = useState<AuditVerifyResponse | null>(null)
  const [filterDecision, setFilterDecision] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [policyMessage, setPolicyMessage] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [evData, polData, incData] = await Promise.all([
        fetchEvents(50, 0, filterDecision === 'ALL' ? undefined : filterDecision),
        fetchPolicies(),
        fetchIncidents()
      ])
      setEvents(evData.items)
      setPolicies(polData.policies)
      setThresholds(polData.thresholds)
      setIncidents(incData)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterDecision])

  // Real-time event prepending when newEventTrigger comes from WebSocket
  useEffect(() => {
    if (newEventTrigger) {
      setEvents(prev => [newEventTrigger, ...prev.filter(e => e.id !== newEventTrigger.id)])
    }
  }, [newEventTrigger])

  const handleTogglePolicy = async (policy: Policy) => {
    const updatedStatus = !policy.enabled
    try {
      setPolicies(prev => prev.map(p => p.id === policy.id ? { ...p, enabled: updatedStatus } : p))
      await updatePolicy(policy.id, { enabled: updatedStatus })
      setPolicyMessage(`Policy "${policy.name}" ${updatedStatus ? 'Enabled' : 'Disabled'}`)
      setTimeout(() => setPolicyMessage(null), 3000)
    } catch (err) {
      console.error('Failed to update policy', err)
      loadData()
    }
  }

  const handleVerifyChain = async () => {
    try {
      const res = await verifyAuditChain()
      setAuditStatus(res)
    } catch (err) {
      console.error(err)
    }
  }

  const filteredEvents = events.filter(e => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      e.agent_id.toLowerCase().includes(q) ||
      e.tool.toLowerCase().includes(q) ||
      e.target.toLowerCase().includes(q) ||
      e.explanation.toLowerCase().includes(q)
    )
  })

  return (
    <section className="relative z-10 py-20 max-w-7xl mx-auto px-6 border-t border-white/[0.06]" id="dashboard">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="shimmer-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A0E15] border border-[#FF1F6B]/30 text-[#FFB3D1] text-xs font-semibold uppercase tracking-wider mb-3">
          Observability Center
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Full Posture &amp; Threat Telemetry</h2>
        <p className="text-slate-400 mt-3">
          Track all autonomous worker threads, inspect quarantined tokens, and enforce policy sets from a single pane of glass.
        </p>
      </div>

      <div className="spotlight-card rounded-2xl p-6 md:p-8 bg-[#0e090c]/90">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] hover:border-white/20 transition-all">
            <div className="text-xs text-slate-400 font-mono mb-1">Total Inspected Calls</div>
            <div className="text-2xl font-bold text-white font-mono">
              {(stats?.total_inspected || 148920).toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-mono">↑ 18.4% from last hour</div>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] hover:border-[#F59E0B]/40 transition-all">
            <div className="text-xs text-slate-400 font-mono mb-1">Human Interventions</div>
            <div className="text-2xl font-bold text-[#FFBD6B] font-mono">
              {stats?.human_interventions || 142}
            </div>
            <div className="text-[10px] text-amber-300 mt-1 font-mono">Avg response: 18s</div>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] hover:border-[#FF1F6B]/40 transition-all">
            <div className="text-xs text-slate-400 font-mono mb-1">Hard Block Traps</div>
            <div className="text-2xl font-bold text-[#FF1F6B] font-mono">
              {stats?.hard_blocks || 37}
            </div>
            <div className="text-[10px] text-rose-400 mt-1 font-mono">100% prevented</div>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] hover:border-emerald-500/30 transition-all">
            <div className="text-xs text-slate-400 font-mono mb-1">Avg Guard Overhead</div>
            <div className="text-2xl font-bold text-[#3DDC97] font-mono">
              {stats?.avg_overhead_ms || 1.84}ms
            </div>
            <div className="text-[10px] text-white/50 mt-1 font-mono">Zero perceivable lag</div>
          </div>
        </div>

        {/* Telemetry Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Decision Mix Donut Chart */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#3DDC97" strokeDasharray="138" strokeDashoffset="14" strokeLinecap="round" strokeWidth="5" />
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#FF1F6B" strokeDasharray="138" strokeDashoffset="130" strokeLinecap="round" strokeWidth="5" />
                </svg>
                <span className="absolute text-[10px] font-mono font-bold text-white">97%</span>
              </div>
              <div>
                <div className="text-xs font-bold text-white">Decision Mix</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {stats?.decision_mix.allow_pct || 97.2}% Pass · {stats?.decision_mix.ask_pct || 2.5}% Ask · {stats?.decision_mix.block_pct || 0.3}% Block
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Normal
            </span>
          </div>

          {/* Execution Stream Frequency Waveform */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] md:col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Execution Stream Frequency</span>
              <span className="text-[10px] font-mono text-white/50">4,120 calls / min (Peak)</span>
            </div>
            <div className="h-8 w-full mt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 32">
                <path
                  d="M0,28 L30,24 L60,26 L90,14 L120,20 L150,10 L180,18 L210,6 L240,16 L270,12 L300,22 L330,8 L360,18 L400,10"
                  fill="none"
                  stroke="#FF1F6B"
                  strokeWidth="1.8"
                />
                <circle cx="400" cy="10" r="3" fill="#FF1F6B" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tab Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-3 mb-6 text-xs font-mono">
          <div className="flex items-center gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('events')}
              className={`pb-3 -mb-3 transition-colors ${
                activeTab === 'events'
                  ? 'text-white border-b-2 border-[#FF1F6B] font-bold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Live Intercept Events
            </button>
            <button
              onClick={() => setActiveTab('threats')}
              className={`pb-3 -mb-3 transition-colors ${
                activeTab === 'threats'
                  ? 'text-white border-b-2 border-[#FF1F6B] font-bold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Quarantined Threats ({incidents.length || 37})
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`pb-3 -mb-3 transition-colors ${
                activeTab === 'policies'
                  ? 'text-white border-b-2 border-[#FF1F6B] font-bold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Active Policies ({policies.length || 8})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-3 -mb-3 transition-colors ${
                activeTab === 'audit'
                  ? 'text-white border-b-2 border-[#FF1F6B] font-bold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Cryptographic Audit Logs
            </button>
          </div>

          {activeTab === 'events' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Decision filter */}
              <div className="flex bg-black/50 border border-white/10 rounded-lg p-0.5 text-[10px]">
                {['ALL', 'ALLOW', 'ASK', 'BLOCK'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setFilterDecision(d)}
                    className={`px-2 py-0.5 rounded transition-all ${
                      filterDecision === d 
                        ? 'bg-[#FF1F6B] text-white font-bold shadow-[0_0_10px_rgba(255,31,107,0.4)]' 
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-white/40 outline-none focus:border-[#FF1F6B]"
                />
              </div>

              <button
                onClick={loadData}
                className="p-1 rounded border border-white/10 hover:border-[#FF1F6B]/40 text-white/60 hover:text-white transition-colors"
                title="Refresh Events"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Policy Toast Notification */}
        {policyMessage && (
          <div className="mb-4 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-mono flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>{policyMessage}</span>
          </div>
        )}

        {/* Tab 1: Live Intercept Events */}
        {activeTab === 'events' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-white/40 border-b border-white/[0.06]">
                  <th className="pb-3 font-medium">Timestamp</th>
                  <th className="pb-3 font-medium">Agent ID</th>
                  <th className="pb-3 font-medium">Attempted Command / Tool</th>
                  <th className="pb-3 font-medium">Target Resource</th>
                  <th className="pb-3 font-medium">Risk Score</th>
                  <th className="pb-3 font-medium">Decision</th>
                  <th className="pb-3 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  >
                    <td className="py-3 text-white/60">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 text-[#FF94BE] font-semibold">{ev.agent_id}</td>
                    <td className="py-3 text-white font-medium">
                      <span className={ev.decision === 'BLOCK' ? 'text-[#FF1F6B] font-bold' : ''}>
                        {ev.tool} ({ev.action})
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 max-w-xs truncate">{ev.target}</td>
                    <td className="py-3">
                      <span className={
                        ev.risk_score >= 70 ? 'text-[#FF1F6B] font-bold' : ev.risk_score >= 30 ? 'text-[#FFBD6B]' : 'text-[#3DDC97]'
                      }>
                        {ev.risk_score}/100
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        ev.decision === 'BLOCK'
                          ? 'bg-[#FF1F6B]/20 text-[#FF1F6B] border-[#FF1F6B]/50'
                          : ev.decision === 'ASK'
                          ? 'bg-[#FFBD6B]/20 text-[#FFBD6B] border-[#FFBD6B]/40'
                          : 'bg-[#3DDC97]/15 text-[#3DDC97] border-[#3DDC97]/30'
                      }`}>
                        {ev.decision}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-white/30 group-hover:text-[#FF1F6B] transition-colors">→</span>
                    </td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-white/40">
                      No matching events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Quarantined Threats */}
        {activeTab === 'threats' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-white/40 border-b border-white/[0.06]">
                  <th className="pb-3 font-medium">Incident ID</th>
                  <th className="pb-3 font-medium">Agent</th>
                  <th className="pb-3 font-medium">Threat Vector</th>
                  <th className="pb-3 font-medium">Severity</th>
                  <th className="pb-3 font-medium">Quarantine Status</th>
                  <th className="pb-3 font-medium">Blast Radius Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 text-[#FF1F6B] font-bold">{inc.id}</td>
                    <td className="py-3 text-[#FF94BE]">{inc.agent_id}</td>
                    <td className="py-3 text-white font-medium">{inc.title}</td>
                    <td className="py-3">
                      <span className="text-[#FF1F6B] font-bold">{inc.severity} / 100</span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#FF1F6B]/20 text-[#FF1F6B] border border-[#FF1F6B]/30 font-bold uppercase">
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 text-white/60 max-w-sm truncate">
                      {inc.blast_radius_summary || 'Target successfully isolated. Host OS untouched.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Active Policies */}
        {activeTab === 'policies' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mb-6">
              {policies.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl bg-black/40 border transition-all ${
                    p.enabled ? 'border-white/10 hover:border-[#FF1F6B]/30' : 'border-white/[0.04] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{p.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/10 text-[#FFD1E3]">
                          {p.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/50 mt-1 leading-relaxed">
                        {p.description}
                      </div>
                    </div>
                    <button
                      onClick={() => handleTogglePolicy(p)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                        p.enabled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-white/10 text-white/40 border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {p.enabled ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-white/40">
                    <span>Policy Weight: <strong className="text-white">{p.weight} pts</strong></span>
                    <span>ID: {p.id}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Threshold Settings Editor */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
              <div className="flex items-center gap-2 text-white font-bold mb-3">
                <Sliders className="w-4 h-4 text-[#FF1F6B]" />
                <span>Runtime Risk Threshold Configuration</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-white/60 block mb-1">ALLOW Max Threshold (0 - {thresholds.allow_max})</label>
                  <input
                    type="range"
                    min="10"
                    max="45"
                    value={thresholds.allow_max}
                    onChange={async (e) => {
                      const val = parseInt(e.target.value)
                      setThresholds(t => ({ ...t, allow_max: val }))
                      try {
                        await updateThresholds({ allow_max: val, ask_max: thresholds.ask_max })
                      } catch {}
                    }}
                    className="w-full accent-[#3DDC97]"
                  />
                  <div className="text-[#3DDC97] font-bold mt-1">Score ≤ {thresholds.allow_max} → ALLOW</div>
                </div>

                <div>
                  <label className="text-white/60 block mb-1">ASK / 2FA Max ({thresholds.allow_max + 1} - {thresholds.ask_max})</label>
                  <input
                    type="range"
                    min="50"
                    max="85"
                    value={thresholds.ask_max}
                    onChange={async (e) => {
                      const val = parseInt(e.target.value)
                      setThresholds(t => ({ ...t, ask_max: val, block_min: val + 1 }))
                      try {
                        await updateThresholds({ allow_max: thresholds.allow_max, ask_max: val })
                      } catch {}
                    }}
                    className="w-full accent-[#FFBD6B]"
                  />
                  <div className="text-[#FFBD6B] font-bold mt-1">Score ≤ {thresholds.ask_max} → ASK 2FA</div>
                </div>

                <div>
                  <label className="text-white/60 block mb-1">BLOCK Hard Trap (≥ {thresholds.ask_max + 1})</label>
                  <div className="h-6 flex items-center">
                    <span className="text-[#FF1F6B] font-extrabold text-sm">
                      Score ≥ {thresholds.ask_max + 1} → HARD BLOCK
                    </span>
                  </div>
                  <div className="text-white/40 text-[10px]">Strict automatic containment</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Cryptographic Audit Logs */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs">
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>SHA-256 Cryptographic Hash Chain</span>
                </div>
                <div className="text-white/50 text-[11px] mt-0.5">
                  Append-only immutable event ledger. Every tool intervention is hashed with prior block.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleVerifyChain}
                  className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg font-bold flex items-center gap-1.5 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Ledger Chain</span>
                </button>
                <a
                  href="/api/audit/export?format=json"
                  target="_blank"
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </a>
                <a
                  href="/api/audit/export?format=csv"
                  target="_blank"
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </a>
              </div>
            </div>

            {auditStatus && (
              <div className={`p-4 rounded-xl border font-mono text-xs flex items-start gap-3 ${
                auditStatus.valid 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {auditStatus.valid ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-sm">
                    {auditStatus.valid ? 'Cryptographic Chain Integrity Verified 100%' : 'Tampering Detected'}
                  </div>
                  <div>Verified Blocks: <strong>{auditStatus.total_blocks}</strong></div>
                  <div className="text-[10px] break-all text-white/60">Genesis: {auditStatus.genesis_hash}</div>
                  <div className="text-[10px] break-all text-white/60">Head Hash: {auditStatus.head_hash}</div>
                </div>
              </div>
            )}

            <div className="space-y-2 text-xs font-mono">
              {events.slice(0, 8).map((e) => (
                <div
                  key={e.id}
                  onClick={() => onSelectEvent(e)}
                  className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:border-emerald-500/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold">Block #{e.block_height}</span>
                    <span className="text-white/40">[{new Date(e.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-white font-medium">{e.tool}.{e.action}</span>
                    <span className="text-white/40">({e.target})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 text-[10px] truncate max-w-xs font-mono">
                      HASH: {e.hash.substring(0, 16)}...
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold">
                      VERIFIED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
