import React from 'react'

interface FooterProps {
  onOpenDemo: () => void
}

export const Footer: React.FC<FooterProps> = ({ onOpenDemo }) => {
  return (
    <footer className="relative z-10 pt-20 pb-16 border-t border-white/[0.08] overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-25 pointer-events-none">
        <svg className="w-full h-full fill-none stroke-[#FF1F6B]" viewBox="0 0 800 400">
          <ellipse cx="400" cy="300" rx="380" ry="140" strokeWidth="0.8" />
          <ellipse cx="400" cy="300" rx="340" ry="120" strokeWidth="0.8" />
          <ellipse cx="400" cy="300" rx="300" ry="100" strokeWidth="0.8" />
          <ellipse cx="400" cy="300" rx="260" ry="80" strokeWidth="0.8" />
        </svg>
      </div>

      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-4">
          Let AI act. <br />
          <span className="hero-gradient-text inline-block">Keep humans in control.</span>
        </h2>
        <p className="text-[#B9A9B1] text-base max-w-xl mx-auto mb-8">
          Deploy AgentGuard in 3 minutes. Stop unpredictable agent actions before they trigger database loss, leaked tokens, or downtime.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <a
            href="#demo"
            onClick={onOpenDemo}
            className="pink-glow-btn px-8 py-3.5 rounded-full bg-[#FF1F6B] hover:bg-[#ff367c] text-white font-bold text-sm tracking-wide transition-transform hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(255,31,107,0.35)]"
          >
            Start Free Sandbox
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="px-8 py-3.5 rounded-full border border-white/20 hover:border-white/40 text-white bg-white/[0.03] transition-all text-sm font-semibold flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>Star on GitHub</span>
          </a>
        </div>

        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-xs text-[#B9A9B1] font-mono">
          <div>© 2026 AgentGuard Inc. Hack-A-Throne 2026 MVP.</div>
          <div className="flex items-center gap-6 mt-4 sm:mt-0">
            <a href="#hero" className="hover:text-white transition-colors">Documentation</a>
            <a href="#hero" className="hover:text-white transition-colors">Privacy</a>
            <a href="#hero" className="hover:text-white transition-colors">Security Advisories</a>
            <a href="#hero" className="hover:text-white transition-colors">Status</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
