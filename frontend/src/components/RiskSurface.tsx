import React from 'react'
import { AlertTriangle } from 'lucide-react'

export const RiskSurface: React.FC = () => {
  return (
    <section className="relative z-10 py-20 max-w-7xl mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="shimmer-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3A0620] border border-[#FF2D7A]/40 text-[#FF2D7A] text-xs font-semibold uppercase tracking-wider mb-3 shadow-[0_0_15px_rgba(255,31,107,0.25)]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#FF2D7A]" />
          <span>Risk Surface</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Autonomous agents move fast. <br />
          <span className="crimson-gradient-text inline-block">Mistakes are irreversible.</span>
        </h2>
        <p className="text-slate-400 mt-4 text-base">
          When you give an LLM bash access, API tokens, and file system privileges, prompt injection or hallucinations become direct existential threats.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Card 1 */}
        <div className="spotlight-card rounded-2xl p-7 flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF1F6B]/20 to-transparent border border-[#FF1F6B]/30 flex items-center justify-center text-[#FF1F6B] text-xl mb-6 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,31,107,0.4)] transition-all">
              💥
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Accidental Damage</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Recursive file deletions, drops on production database clusters, or malformed cloud infrastructure provisioning driven by hallucinated agent reasoning loops.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-[#FF1F6B] flex items-center gap-1.5">
            <span className="text-white/40">Target:</span> 
            <span className="font-semibold">rm -rf / clusters</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="spotlight-card rounded-2xl p-7 flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFBD6B]/20 to-transparent border border-[#FFBD6B]/30 flex items-center justify-center text-[#FFBD6B] text-xl mb-6 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,189,107,0.4)] transition-all">
              🔓
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sensitive Access Exfiltration</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Agents lured via prompt-injected emails or files to curl environment secrets, Stripe keys, and customer PII straight out to third-party command servers.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-[#FFBD6B] flex items-center gap-1.5">
            <span className="text-white/40">Target:</span> 
            <span className="font-semibold">.env &amp; Auth Credentials</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="spotlight-card rounded-2xl p-7 flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF1F6B]/20 to-transparent border border-[#FF1F6B]/30 flex items-center justify-center text-[#FF1F6B] text-xl mb-6 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,31,107,0.4)] transition-all">
              👁️‍🗨️
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Missing Supervision</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Autonomous loops run at 2:00 AM on background jobs. Static permission models are either too restrictive to let agents work, or too permissive to keep you safe.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-[#3DDC97] flex items-center gap-1.5">
            <span className="text-white/40">Target:</span> 
            <span className="font-semibold">Human-in-the-Loop Gaps</span>
          </div>
        </div>
      </div>

      {/* Quote Glow Border Banner */}
      <div className="quote-glow-border relative overflow-hidden rounded-2xl p-8 md:p-12 text-center bg-gradient-to-r from-[#210512] via-[#2d0719] to-[#1e0410] border border-[#FF2D7A]/30 shadow-[0_0_50px_rgba(255,31,107,0.18)]">
        <div className="text-xs uppercase font-mono tracking-widest text-[#FF2D7A] mb-2 font-semibold">Core Principle</div>
        <blockquote className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
          “Permission to run <span className="text-[#FF1F6B] inline-block hover:scale-125 transition-transform duration-200">≠</span> permission to do anything.”
        </blockquote>
        <div className="mt-4 text-xs font-mono text-slate-400">Zero-trust runtime guardrails between LLM decisions and host OS tools.</div>
      </div>
    </section>
  )
}
