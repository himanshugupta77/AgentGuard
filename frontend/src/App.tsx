import React, { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { RiskSurface } from './components/RiskSurface'
import { PipelineInterception } from './components/PipelineInterception'
import { RiskEngineExplanation } from './components/RiskEngineExplanation'
import { InteractiveSandbox } from './components/InteractiveSandbox'
import { Dashboard } from './components/Dashboard'
import { Architecture } from './components/Architecture'
import { Roadmap } from './components/Roadmap'
import { Footer } from './components/Footer'
import { EventDetailDrawer } from './components/EventDetailDrawer'
import { fetchStats, wsClient } from './services/api'
import { StatsSummary, ToolEvent } from './types'
import { AlertCircle, ShieldAlert, X } from 'lucide-react'

export const App: React.FC = () => {
  const [stats, setStats] = useState<StatsSummary | null>(null)
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false)
  const [selectedEvent, setSelectedEvent] = useState<ToolEvent | null>(null)
  const [newEventTrigger, setNewEventTrigger] = useState<ToolEvent | null>(null)
  const [toastEvent, setToastEvent] = useState<ToolEvent | null>(null)

  useEffect(() => {
    // Initial fetch of stats
    fetchStats().then(setStats).catch(console.error)

    // Setup WebSocket
    wsClient.connect()
    const unsubscribeStatus = wsClient.onStatus(setIsBackendConnected)
    const unsubscribeEvents = wsClient.onEvent((ev) => {
      if (ev && ev.type === 'tool_event' && ev.data) {
        const toolEv = ev.data as ToolEvent
        setNewEventTrigger(toolEv)
        // Refresh telemetry stats
        fetchStats().then(setStats).catch(console.error)

        // Show toast alert for high risk intercepts
        if (toolEv.decision === 'BLOCK' || toolEv.decision === 'ASK') {
          setToastEvent(toolEv)
          setTimeout(() => setToastEvent(null), 6000)
        }
      }
    })

    // Periodic stats refresher
    const timer = setInterval(() => {
      fetchStats().then(setStats).catch(console.error)
    }, 15000)

    return () => {
      unsubscribeStatus()
      unsubscribeEvents()
      clearInterval(timer)
    }
  }, [])

  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#050204] bg-mesh-glow relative text-white selection:bg-[#FF1F6B] selection:text-white overflow-x-hidden">
      {/* Ambient Hot Pink & Crimson Spirograph Swirls */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[12%] -right-[8%] w-[950px] h-[950px] animate-spin-slow opacity-40">
          <svg className="w-full h-full fill-none stroke-[#FF1F6B]" strokeWidth="0.85" viewBox="0 0 800 800">
            <defs>
              <linearGradient id="swirlGradPink1" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#FF1F6B" stopOpacity="0.65" />
                <stop offset="50%" stopColor="#B0004A" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3A0620" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <g stroke="url(#swirlGradPink1)">
              <ellipse cx="400" cy="400" rx="360" ry="140" transform="rotate(0 400 400)" />
              <ellipse cx="400" cy="400" rx="360" ry="140" transform="rotate(15 400 400)" />
              <ellipse cx="400" cy="400" rx="360" ry="140" transform="rotate(30 400 400)" />
              <ellipse cx="400" cy="400" rx="360" ry="140" transform="rotate(45 400 400)" />
              <ellipse cx="400" cy="400" rx="360" ry="140" transform="rotate(60 400 400)" />
              <ellipse cx="400" cy="400" rx="360" ry="140" transform="rotate(75 400 400)" />
              <ellipse cx="400" cy="400" rx="360" ry="140" transform="rotate(90 400 400)" />
              <ellipse cx="400" cy="400" rx="360" ry="140" transform="rotate(105 400 400)" />
              <ellipse cx="400" cy="400" rx="360" ry="140" transform="rotate(120 400 400)" />
              <ellipse cx="400" cy="400" rx="360" ry="140" transform="rotate(135 400 400)" />
              <ellipse cx="400" cy="400" rx="360" ry="140" transform="rotate(150 400 400)" />
              <ellipse cx="400" cy="400" rx="360" ry="140" transform="rotate(165 400 400)" />
            </g>
            <circle cx="400" cy="400" fill="#050204" r="95" stroke="#FF1F6B" strokeOpacity="0.35" strokeWidth="1.2" />
          </svg>
        </div>
        <div className="absolute -bottom-[20%] -left-[15%] w-[1000px] h-[1000px] animate-spin-reverse-slow opacity-30">
          <svg className="w-full h-full fill-none stroke-[#FF2D7A]" strokeWidth="0.8" viewBox="0 0 800 800">
            <g stroke="rgba(255, 31, 107, 0.35)">
              <ellipse cx="400" cy="400" rx="380" ry="110" transform="rotate(15 400 400)" />
              <ellipse cx="400" cy="400" rx="380" ry="110" transform="rotate(45 400 400)" />
              <ellipse cx="400" cy="400" rx="380" ry="110" transform="rotate(75 400 400)" />
              <ellipse cx="400" cy="400" rx="380" ry="110" transform="rotate(105 400 400)" />
              <ellipse cx="400" cy="400" rx="380" ry="110" transform="rotate(135 400 400)" />
              <ellipse cx="400" cy="400" rx="380" ry="110" transform="rotate(165 400 400)" />
            </g>
            <circle cx="400" cy="400" fill="#050204" r="110" stroke="#FF1F6B" strokeOpacity="0.3" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* Live Floating Security Alert Toast */}
      {toastEvent && (
        <div 
          onClick={() => setSelectedEvent(toastEvent)}
          className={`fixed top-20 right-6 z-50 p-4 rounded-xl border backdrop-blur-xl shadow-2xl cursor-pointer max-w-sm font-mono text-xs animate-slide-left transition-all ${
            toastEvent.decision === 'BLOCK' 
              ? 'bg-[#18090f]/95 border-[#FF1F6B] shadow-[0_0_25px_rgba(255,31,107,0.4)]' 
              : 'bg-[#181308]/95 border-[#FFBD6B] shadow-[0_0_25px_rgba(255,189,107,0.4)]'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-4 h-4 ${toastEvent.decision === 'BLOCK' ? 'text-[#FF1F6B]' : 'text-[#FFBD6B]'}`} />
              <span className={`font-extrabold uppercase ${toastEvent.decision === 'BLOCK' ? 'text-[#FF1F6B]' : 'text-[#FFBD6B]'}`}>
                {toastEvent.decision === 'BLOCK' ? 'Containment Alert' : 'Authorization Needed'}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setToastEvent(null)
              }}
              className="text-white/40 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-white font-bold mt-1.5">{toastEvent.tool} ({toastEvent.action})</div>
          <div className="text-white/60 text-[11px] truncate mt-0.5">{toastEvent.target}</div>
          <div className="text-[10px] text-white/40 mt-2 flex items-center justify-between">
            <span>Score: <strong className={toastEvent.decision === 'BLOCK' ? 'text-[#FF1F6B]' : 'text-[#FFBD6B]'}>{toastEvent.risk_score}/100</strong></span>
            <span className="text-[#FF1F6B] underline">Inspect Event →</span>
          </div>
        </div>
      )}

      <Header isBackendConnected={isBackendConnected} onOpenDemo={scrollToDemo} />
      
      <main>
        <Hero stats={stats} onOpenDemo={scrollToDemo} />
        <RiskSurface />
        <PipelineInterception />
        <RiskEngineExplanation />
        <InteractiveSandbox />
        <Dashboard stats={stats} onSelectEvent={setSelectedEvent} newEventTrigger={newEventTrigger} />
        <Architecture />
        <Roadmap />
      </main>

      <Footer onOpenDemo={scrollToDemo} />

      {/* Slide-over Detail Drawer */}
      <EventDetailDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  )
}
