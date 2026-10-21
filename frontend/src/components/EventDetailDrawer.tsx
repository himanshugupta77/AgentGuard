import React from 'react'
import { X, Shield, Lock, Copy, Check } from 'lucide-react'
import { ToolEvent } from '../types'

interface EventDetailDrawerProps {
  event: ToolEvent | null
  onClose: () => void
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({ event, onClose }) => {
  const [copied, setCopied] = React.useState(false)

  if (!event) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end animate-fade-in">
      <div 
        className="w-full max-w-xl h-full bg-[#121012] border-l border-white/10 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto text-xs font-mono shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FF1F6B]/20 border border-[#FF1F6B]/40 flex items-center justify-center text-[#FF1F6B]">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">Security Intercept Event</div>
                <div className="text-white/40 text-[10px]">Block Height #{event.block_height} · {event.id}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Decision & Score Card */}
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 mb-6 flex items-center justify-between">
            <div>
              <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Gateway Verdict</div>
              <span className={`px-3 py-1 rounded text-xs font-extrabold border ${
                event.decision === 'BLOCK'
                  ? 'bg-[#FF1F6B]/20 text-[#FF1F6B] border-[#FF1F6B]'
                  : event.decision === 'ASK'
                  ? 'bg-[#FFBD6B]/20 text-[#FFBD6B] border-[#FFBD6B]'
                  : 'bg-[#3DDC97]/20 text-[#3DDC97] border-[#3DDC97]'
              }`}>
                {event.decision}
              </span>
            </div>
            <div className="text-right">
              <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">Evaluated Risk Score</div>
              <div className={`text-2xl font-extrabold ${
                event.risk_score >= 70 ? 'text-[#FF1F6B]' : event.risk_score >= 30 ? 'text-[#FFBD6B]' : 'text-[#3DDC97]'
              }`}>
                {event.risk_score} <span className="text-sm text-white/40">/ 100</span>
              </div>
            </div>
          </div>

          {/* Core Info Details */}
          <div className="space-y-4 mb-6">
            <div>
              <span className="text-white/40 block mb-1">Attempted Invocation</span>
              <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-white font-mono">
                <span className="text-[#FFB3D1]">{event.agent_id}</span>
                <span className="text-white/50"> invoked </span>
                <span className="text-[#FF1F6B] font-bold">{event.tool}.{event.action}</span>
                <div className="text-[#B9A9B1] mt-1 break-all">target: "{event.target}"</div>
              </div>
            </div>

            <div>
              <span className="text-white/40 block mb-1">Plain-English Explanation</span>
              <p className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300 leading-relaxed">
                {event.explanation}
              </p>
            </div>

            {/* Triggered Heuristics */}
            <div>
              <span className="text-white/40 block mb-1">Triggered Security Heuristics</span>
              <div className="space-y-1.5">
                {event.reasons.map((r, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-white font-bold">{r.name}</span>
                      <div className="text-white/50 text-[10px] mt-0.5">{r.detail}</div>
                    </div>
                    <span className="text-[#FF1F6B] font-bold">+{r.weight} pts</span>
                  </div>
                ))}
                {event.reasons.length === 0 && (
                  <div className="p-2.5 rounded-lg bg-black/40 text-white/40 text-center">
                    No heuristic violations found.
                  </div>
                )}
              </div>
            </div>

            {/* Execution / Containment Status */}
            <div>
              <span className="text-white/40 block mb-1">Execution Containment Status</span>
              <div className="p-3 rounded-lg bg-black/60 border border-white/10 flex items-center justify-between">
                <span className="text-white/70">Execution Status:</span>
                <span className="font-bold uppercase text-white">{event.execution_status}</span>
              </div>
              {event.execution_output && (
                <div className="mt-2 p-2.5 bg-black/80 rounded border border-white/5 text-white/60 font-mono text-[11px] max-h-24 overflow-y-auto">
                  {event.execution_output}
                </div>
              )}
            </div>

            {/* Cryptographic Ledger Block */}
            <div className="p-3.5 rounded-xl bg-black/70 border border-emerald-500/20 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Cryptographic Audit Proof</span>
              </div>
              <div className="break-all text-white/50">Block Hash: <span className="text-white/80">{event.hash}</span></div>
              <div className="break-all text-white/50">Prev Hash: <span className="text-white/60">{event.prev_hash}</span></div>
              <div className="text-emerald-400/80 mt-1">Status: Hash verified against SHA-256 chain</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied JSON' : 'Copy Event JSON'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#FF1F6B] hover:bg-[#ff367c] text-white font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
