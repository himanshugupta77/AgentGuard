import React from 'react'

export const Roadmap: React.FC = () => {
  return (
    <section className="relative z-10 py-20 max-w-7xl mx-auto px-6 border-t border-white/[0.06]">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="shimmer-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A0E15] border border-[#FF1F6B]/30 text-[#FFB3D1] text-xs font-semibold uppercase tracking-wider mb-3">
          Roadmap
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Built for Mission-Critical Production</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
        <div className="spotlight-card rounded-2xl p-6">
          <div className="text-xs font-mono text-[#3DDC97] mb-2 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97]"></span>
            <span>RELEASED (Q1 2026)</span>
          </div>
          <h4 className="text-lg font-bold text-white mb-2">Deterministic AST Parser</h4>
          <p className="text-xs text-[#B9A9B1] leading-relaxed">
            Full bash command shlex parsing, SQL table mutation checking, and network egress IP blacklisting.
          </p>
        </div>

        <div className="spotlight-card rounded-2xl p-6 border-[#FF1F6B]/40 shadow-[0_0_20px_rgba(255,31,107,0.15)]">
          <div className="text-xs font-mono text-[#FF1F6B] mb-2 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF1F6B] animate-ping"></span>
            <span>CURRENT (Q2 2026)</span>
          </div>
          <h4 className="text-lg font-bold text-white mb-2">Contextual Memory Guard</h4>
          <p className="text-xs text-[#B9A9B1] leading-relaxed">
            Cross-step anomaly detection: flags when an agent slowly modifies files across multiple turns to circumvent single-step policies.
          </p>
        </div>

        <div className="spotlight-card rounded-2xl p-6">
          <div className="text-xs font-mono text-purple-400 mb-2 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span>UPCOMING (Q3 2026)</span>
          </div>
          <h4 className="text-lg font-bold text-white mb-2">eBPF Kernel Enclave</h4>
          <p className="text-xs text-[#B9A9B1] leading-relaxed">
            Zero-overhead kernel level enforcement inside Linux containers with cryptographic tamper-evident event streaming.
          </p>
        </div>
      </div>
    </section>
  )
}
