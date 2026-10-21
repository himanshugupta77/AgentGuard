import React from 'react'

export const PipelineInterception: React.FC = () => {
  return (
    <section className="relative z-10 py-20 max-w-7xl mx-auto px-6 border-t border-white/[0.06]" id="pipeline">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="shimmer-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3A0620] border border-[#FF2D7A]/40 text-[#FF2D7A] text-xs font-semibold uppercase tracking-wider mb-3 shadow-[0_0_15px_rgba(255,31,107,0.25)]">
          Pipeline Interception
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">How AgentGuard Intervenes</h2>
        <p className="text-slate-400 mt-3">Every tool payload is intercepted at the network/socket boundary before execution.</p>
      </div>

      <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-0 relative">
        {/* Step 1 */}
        <div className="w-full md:flex-1 spotlight-card rounded-2xl p-5 lg:p-6 relative flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold text-white/40 mb-2">01 / DISPATCH</div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FFD1E3] mb-4 text-xl">
              🤖
            </div>
            <h4 className="text-base font-bold text-white">AI Agent</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Autonomous model formulates tool invocation schema (e.g. bash, fs_write, sql_exec).
            </p>
          </div>
        </div>
        
        {/* Connector 1 */}
        <div className="hidden md:flex self-center flex-shrink-0 w-4 lg:w-6 h-[2px] bg-gradient-to-r from-white/20 to-[#FF1F6B] pipeline-connector"></div>
        <div className="md:hidden flex justify-center -my-1">
          <div className="w-[2px] h-4 bg-gradient-to-b from-white/20 to-[#FF1F6B] pipeline-connector-vertical"></div>
        </div>

        {/* Step 2 */}
        <div className="w-full md:flex-1 spotlight-card rounded-2xl p-5 lg:p-6 relative flex flex-col justify-between border-[#FF1F6B] shadow-[0_0_35px_rgba(255,31,107,0.35)] bg-[#240615]/90 ring-1 ring-[#FF1F6B]/40">
          <div>
            <div className="text-[10px] font-mono font-bold text-[#FF1F6B] mb-2 flex items-center justify-between">
              <span>02 / INTERCEPT</span>
              <span className="w-2 h-2 rounded-full bg-[#FF1F6B] animate-ping"></span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF1F6B] to-[#B0004A] text-white flex items-center justify-center text-lg mb-4 shadow-[0_0_20px_rgba(255,31,107,0.6)]">
              🛡️
            </div>
            <h4 className="text-base font-bold text-white">AgentGuard Engine</h4>
            <p className="text-xs text-[#FFD1E3] mt-2 leading-relaxed font-medium">
              Inspects parameter semantics, checks stateful context, path safety, and evaluates risk score.
            </p>
          </div>
        </div>

        {/* Connector 2 */}
        <div className="hidden md:flex self-center flex-shrink-0 w-4 lg:w-6 h-[2px] bg-gradient-to-r from-[#FF1F6B] to-[#3DDC97] pipeline-connector"></div>
        <div className="md:hidden flex justify-center -my-1">
          <div className="w-[2px] h-4 bg-gradient-to-b from-[#FF1F6B] to-[#3DDC97] pipeline-connector-vertical"></div>
        </div>

        {/* Step 3 */}
        <div className="w-full md:flex-1 spotlight-card rounded-2xl p-5 lg:p-6 relative flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold text-white/40 mb-2">03 / DECISION</div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg mb-4">
              ⚖️
            </div>
            <h4 className="text-base font-bold text-white">3-Way Policy</h4>
            <div className="flex flex-col gap-1.5 mt-2 font-mono text-[11px]">
              <span className="text-[#3DDC97]">✔ ALLOW (Instant)</span>
              <span className="text-[#FFBD6B]">❓ ASK (2-Factor/Slack)</span>
              <span className="text-[#FF1F6B]">⛔ BLOCK (Isolated)</span>
            </div>
          </div>
        </div>

        {/* Connector 3 */}
        <div className="hidden md:flex self-center flex-shrink-0 w-4 lg:w-6 h-[2px] bg-gradient-to-r from-[#3DDC97] to-white/20 pipeline-connector"></div>
        <div className="md:hidden flex justify-center -my-1">
          <div className="w-[2px] h-4 bg-gradient-to-b from-[#3DDC97] to-white/20 pipeline-connector-vertical"></div>
        </div>

        {/* Step 4 */}
        <div className="w-full md:flex-1 spotlight-card rounded-2xl p-5 lg:p-6 relative flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold text-white/40 mb-2">04 / EXECUTION</div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg mb-4">
              💻
            </div>
            <h4 className="text-base font-bold text-white">System Tools</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Only validated and sanitized operations touch the host machine, file system, or live DB.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
