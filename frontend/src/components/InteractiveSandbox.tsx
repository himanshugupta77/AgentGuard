import React, { useState, useEffect } from 'react'
import { RotateCcw, Check, X, Terminal, Shield, AlertTriangle, ArrowRight } from 'lucide-react'
import { evaluateToolCall, resolveApproval } from '../services/api'
import { EvaluationResponse, TriggeredHeuristic } from '../types'

interface ScenarioData {
  id: number
  title: string
  score: number
  decision: 'ALLOW' | 'ASK' | 'BLOCK'
  tool: string
  action: string
  target: string
  args: Record<string, any>
  consoleLines: string[]
  heuristics: TriggeredHeuristic[]
  requiresApproval: boolean
}

const PRESET_SCENARIOS: Record<number, ScenarioData> = {
  1: {
    id: 1,
    title: 'Safe File Edit',
    score: 0,
    decision: 'ALLOW',
    tool: 'safe_fs',
    action: 'write',
    target: './docs/README.md',
    args: { content: '# Updated Documentation' },
    consoleLines: [
      '[TASK] Stated Goal: "Review and update project documentation"',
      '[ACTION] Tool invocation: safe_fs.write(path="./docs/README.md")',
      '[AGENTGUARD] Intercepting payload at socket boundary...',
      '✔ Path is inside workspace boundary (/docs). 0 destructive patterns.',
      '[EXECUTE] Action authorized. Writing 42 lines to disk. Exit code 0.'
    ],
    heuristics: [
      { name: 'Target Path', weight: 0, detail: './docs/README.md (Approved Scope)', type: 'path' },
      { name: 'Elevated Privileges', weight: 0, detail: 'None Required', type: 'shell' }
    ],
    requiresApproval: false
  },
  2: {
    id: 2,
    title: 'Bulk File Rename',
    score: 45,
    decision: 'ASK',
    tool: 'safe_fs',
    action: 'rename',
    target: './assets/*',
    args: { destination: './archive/', affected_count: 48 },
    consoleLines: [
      '[TASK] Stated Goal: "Organize asset archives"',
      '[ACTION] Tool invocation: safe_fs.rename(src="./assets/*", dest="./archive/")',
      '[AGENTGUARD] Intercepting payload at socket boundary...',
      '⚠️ Bulk mutation threshold exceeded: 48 paths impacted (Threshold: 10).',
      '[PAUSED] Pausing agent thread: Human-in-the-loop 2FA authorization requested.'
    ],
    heuristics: [
      { name: 'Bulk Mutation Throttle', weight: 45, detail: 'Bulk file renaming pattern detected', type: 'burst' },
      { name: 'Operator Review', weight: 0, detail: 'Awaiting human 2FA approval', type: 'custom' }
    ],
    requiresApproval: true
  },
  3: {
    id: 3,
    title: 'Delete Project Folder',
    score: 100,
    decision: 'BLOCK',
    tool: 'safe_shell',
    action: 'exec',
    target: 'rm -rf ./src/',
    args: { command: 'rm -rf ./src/' },
    consoleLines: [
      '[TASK] Stated Goal: "Organize project assets in /workspace"',
      '[ACTION] Tool invocation: safe_shell.exec("rm -rf ./src/")',
      '[AGENTGUARD] Intercepting payload at socket boundary...',
      '⛔ CRITICAL BOUNDARY VIOLATION DETECTED:',
      '   • Intent vs Action Mismatch (Organizing assets ≠ wiping core source)',
      '   • Recursive deletion flags (-rf) on directory',
      '   • Protected core codebase target (./src/)',
      '⛔ HARD TRAP TRIGGERED (Severity: 100/100). Containment active.',
      '[CONTAINMENT] Host file system untouched. Threat signature quarantined.'
    ],
    heuristics: [
      { name: 'Recursive Deletion', weight: 85, detail: 'Recursive file deletion requested (rm -rf)', type: 'shell' },
      { name: 'Core Codebase Target', weight: 50, detail: './src/ (Application Core)', type: 'path' },
      { name: 'Intent vs Action Mismatch', weight: 40, detail: 'Organize assets does not warrant source deletion', type: 'intent' }
    ],
    requiresApproval: false
  }
}

export const InteractiveSandbox: React.FC = () => {
  const [currentScenarioId, setCurrentScenarioId] = useState<number>(3)
  const [presetScores, setPresetScores] = useState<Record<number, number>>({ 1: 0, 2: 45, 3: 100 })
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [activeStep, setActiveStep] = useState<number>(4)
  const [approvalState, setApprovalState] = useState<'pending' | 'approved' | 'denied'>('pending')
  const [isShaking, setIsShaking] = useState<boolean>(true)
  const [customInput, setCustomInput] = useState<string>('')
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false)
  const [evalResult, setEvalResult] = useState<EvaluationResponse | null>(null)

  const scenario = PRESET_SCENARIOS[currentScenarioId]

  const runScenario = async (id: number) => {
    setCurrentScenarioId(id)
    setIsCustomMode(false)
    setApprovalState('pending')
    const sc = PRESET_SCENARIOS[id]

    try {
      const res = await evaluateToolCall({
        agent_id: 'InteractiveSandboxAgent',
        tool: sc.tool,
        action: sc.action,
        target: sc.target,
        args: sc.args,
        stated_intent: id === 1
          ? 'Review and update project documentation'
          : id === 2
          ? 'Organize asset archives'
          : 'Organize project assets in /workspace'
      })
      setEvalResult(res)
      setPresetScores(prev => ({ ...prev, [id]: res.risk_score }))

      const lines = [
        `[TASK] Stated Goal: "${id === 1 ? 'Review and update project documentation' : id === 2 ? 'Organize asset archives' : 'Organize project assets in /workspace'}"`,
        `[ACTION] Tool invocation: ${sc.tool}.${sc.action}(target="${sc.target}")`,
        `[AGENTGUARD] Evaluated runtime risk: ${res.risk_score}/100 -> ${res.decision}`,
        res.explanation,
        res.decision === 'BLOCK'
          ? '⛔ Hard trap triggered. Host untouched.'
          : res.decision === 'ASK'
          ? '⚠️ Pausing agent thread: Human-in-the-loop 2FA authorization requested.'
          : '✔ Allowed. Routine operation executed in workspace.'
      ]
      startTypewriter(lines, res.decision === 'BLOCK')
    } catch {
      // Fallback gracefully to default preset scenario lines
      startTypewriter(sc.consoleLines, sc.decision === 'BLOCK')
    }
  }

  const startTypewriter = (lines: string[], shouldShake: boolean) => {
    setIsTyping(true)
    setDisplayedLines([])
    setIsShaking(false)
    setActiveStep(1)

    lines.forEach((line, index) => {
      setTimeout(() => {
        setDisplayedLines(prev => [...prev, line])
        if (index === 1) setActiveStep(2)
        if (index === 2) setActiveStep(3)
        if (index === 3) setActiveStep(4)
        if (index === lines.length - 1) {
          setIsTyping(false)
          setActiveStep(5)
          if (shouldShake) {
            setIsShaking(true)
            setTimeout(() => setIsShaking(false), 500)
          }
        }
      }, (index + 1) * 220)
    })
  }

  useEffect(() => {
    runScenario(3)
  }, [])

  const handleApprove = async () => {
    setApprovalState('approved')
    setDisplayedLines(prev => [
      ...prev,
      '✔ Operator approved execution via Authenticated Hook. Resuming agent.'
    ])
    // Try resolving on real backend
    try {
      await resolveApproval('apprv-demo-01', 'approve')
    } catch {
      // simulated
    }
  }

  const handleDeny = async () => {
    setApprovalState('denied')
    setDisplayedLines(prev => [
      ...prev,
      '⛔ Operator denied execution. Operation discarded safely.'
    ])
    try {
      await resolveApproval('apprv-demo-01', 'deny')
    } catch {
      // simulated
    }
  }

  const handleCustomEvaluate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customInput.trim()) return

    setIsCustomMode(true)
    setIsTyping(true)
    setActiveStep(2)

    const cmd = customInput.trim()
    setDisplayedLines([
      `[CUSTOM PROMPT] Operator dispatch: "${cmd}"`,
      `[AGENT] Invoking tool gateway...`
    ])

    try {
      const isHttp = cmd.startsWith('http://') || cmd.startsWith('https://')
      const isShell = cmd.includes('rm') || cmd.includes('cat') || cmd.includes('sudo') || cmd.includes('chmod') || cmd.includes('bash') || cmd.includes(';') || cmd.includes('&&') || cmd.includes('||') || cmd.includes('|') || cmd.includes('shutil') || cmd.includes('delete') || cmd.toLowerCase().includes('simulate') || cmd.toLowerCase().includes('dry run')

      const res = await evaluateToolCall({
        agent_id: 'InteractiveSandboxAgent',
        tool: isHttp ? 'safe_http' : (isShell ? 'safe_shell' : 'safe_fs'),
        action: 'exec',
        target: cmd,
        stated_intent: 'Custom interactive testing'
      })

      setEvalResult(res)
      setActiveStep(4)
      setDisplayedLines(prev => [
        ...prev,
        `[AGENTGUARD] Evaluated risk score: ${res.risk_score}/100 -> ${res.decision}`,
        res.explanation,
        res.decision === 'BLOCK' 
          ? '⛔ Hard block triggered. Execution refused.' 
          : res.decision === 'ASK' 
          ? '⚠️ Requires human 2FA operator approval.' 
          : '✔ Allowed. Routine operation.'
      ])
      setIsTyping(false)
      setActiveStep(5)

      if (res.decision === 'BLOCK') {
        setIsShaking(true)
        setTimeout(() => setIsShaking(false), 500)
      }
    } catch (err) {
      console.error(err)
      setIsTyping(false)
    }
  }

  const currentScore = evalResult ? evalResult.risk_score : scenario.score
  const currentDecision = evalResult ? evalResult.decision : scenario.decision
  const currentHeuristics = evalResult ? evalResult.reasons : scenario.heuristics

  return (
    <section className="relative z-10 py-20 max-w-7xl mx-auto px-6" id="demo">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="shimmer-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A0E15] border border-[#FF1F6B]/40 text-[#FF1F6B] text-xs font-bold uppercase tracking-wider mb-3 shadow-[0_0_15px_rgba(255,31,107,0.3)]">
          Interactive Sandbox
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Experience Live Interception
        </h2>
        <p className="text-slate-400 mt-3">
          Select a scenario below or enter any custom command to watch the runtime security layer evaluate in real-time.
        </p>

        {/* Preset Scenario Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button
            onClick={() => runScenario(1)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold font-mono transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95 ${
              !isCustomMode && currentScenarioId === 1
                ? 'border border-[#3DDC97] bg-[#3DDC97]/25 text-white shadow-[0_0_15px_rgba(61,220,151,0.4)] ring-2 ring-white/30'
                : 'border border-[#3DDC97]/40 bg-[#3DDC97]/10 text-white/80 hover:bg-[#3DDC97]/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#3DDC97]"></span>
            <span>Scenario 1: Safe File Edit (Score: {presetScores[1] !== undefined ? presetScores[1] : 0})</span>
          </button>

          <button
            onClick={() => runScenario(2)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold font-mono transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95 ${
              !isCustomMode && currentScenarioId === 2
                ? 'border border-[#FFBD6B] bg-[#FFBD6B]/25 text-white shadow-[0_0_15px_rgba(255,189,107,0.4)] ring-2 ring-white/30'
                : 'border border-[#FFBD6B]/40 bg-[#FFBD6B]/10 text-white/80 hover:bg-[#FFBD6B]/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#FFBD6B]"></span>
            <span>Scenario 2: Bulk Rename (Score: {presetScores[2] !== undefined ? presetScores[2] : 45})</span>
          </button>

          <button
            onClick={() => runScenario(3)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold font-mono transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95 ${
              !isCustomMode && currentScenarioId === 3
                ? 'border border-[#FF1F6B] bg-[#FF1F6B]/30 text-white shadow-[0_0_20px_rgba(255,31,107,0.5)] ring-2 ring-white/40 scale-105'
                : 'border border-[#FF1F6B]/50 bg-[#FF1F6B]/10 text-white/80 hover:bg-[#FF1F6B]/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#FF1F6B] animate-ping"></span>
            <span>Scenario 3: Delete Project Folder (Score: {presetScores[3] !== undefined ? presetScores[3] : 100})</span>
          </button>
        </div>

        {/* Custom Input Bar */}
        <form onSubmit={handleCustomEvaluate} className="max-w-2xl mx-auto mt-6 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Or test custom command: e.g. cat ~/.aws/credentials, rm -rf /var, git push..."
              className="w-full bg-[#121012] border border-white/15 focus:border-[#FF1F6B] rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-white/40 outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="pink-glow-btn px-5 py-2.5 bg-gradient-to-r from-[#FF1F6B] to-[#B0004A] text-white rounded-xl text-xs font-bold font-mono transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,31,107,0.4)] flex items-center gap-1.5"
          >
            <span>Evaluate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Sandbox Terminal Window */}
      <div 
        id="demoContainer"
        className={`max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/[0.12] bg-[#0c0a0c] shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative transition-transform ${
          isShaking ? 'shake-active' : ''
        }`}
      >
        {/* Top Window Bar */}
        <div className="h-10 bg-[#161214] border-b border-white/[0.08] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            <span className="ml-3 font-mono text-xs text-white/40">
              agentguard-sandbox ~ session #ag-9942
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${
              currentDecision === 'BLOCK' ? 'bg-[#FF1F6B] animate-pulse' : currentDecision === 'ASK' ? 'bg-[#FFBD6B]' : 'bg-[#3DDC97]'
            }`}></span>
            <span className={currentDecision === 'BLOCK' ? 'text-[#FF1F6B] font-bold' : currentDecision === 'ASK' ? 'text-[#FFBD6B]' : 'text-[#3DDC97]'}>
              {currentDecision === 'BLOCK' ? 'THREAT CONTAINED' : currentDecision === 'ASK' ? 'AWAITING APPROVAL' : 'ALLOWED (PASS)'}
            </span>
          </div>
        </div>

        {/* 5-Step Progression Stepper */}
        <div className="bg-[#120e11] border-b border-white/[0.06] px-6 py-3 flex items-center justify-between text-xs font-mono overflow-x-auto">
          <div className={`flex items-center gap-2 ${activeStep >= 1 ? 'text-[#FF1F6B] font-bold' : 'text-white/40'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${activeStep >= 1 ? 'border-[#FF1F6B] text-[#FF1F6B]' : 'border-white/20'}`}>1</span> Task
          </div>
          <span className="text-white/20">→</span>
          <div className={`flex items-center gap-2 ${activeStep >= 2 ? 'text-[#FF1F6B] font-bold' : 'text-white/40'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${activeStep >= 2 ? 'border-[#FF1F6B] text-[#FF1F6B]' : 'border-white/20'}`}>2</span> Action
          </div>
          <span className="text-white/20">→</span>
          <div className={`flex items-center gap-2 ${activeStep >= 3 ? 'text-[#FF1F6B] font-bold' : 'text-white/40'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${activeStep >= 3 ? 'border-[#FF1F6B] text-[#FF1F6B]' : 'border-white/20'}`}>3</span> Detect
          </div>
          <span className="text-white/20">→</span>
          <div className={`flex items-center gap-2 ${activeStep >= 4 ? 'text-[#FF1F6B] font-bold' : 'text-white/40'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${activeStep >= 4 ? 'border-[#FF1F6B] text-[#FF1F6B]' : 'border-white/20'}`}>4</span> Respond
          </div>
          <span className="text-white/20">→</span>
          <div className={`flex items-center gap-2 ${activeStep >= 5 ? 'text-[#FF1F6B] font-bold' : 'text-white/40'}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${activeStep >= 5 ? 'border-[#FF1F6B] text-[#FF1F6B]' : 'border-white/20'}`}>5</span> Audit
          </div>
        </div>

        {/* Main Grid: Terminal Console (Left) + Guard Evaluation (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[440px]">
          {/* Terminal Console */}
          <div className="lg:col-span-7 p-6 font-mono text-xs border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-black/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-white/40 pb-3 border-b border-white/[0.05] mb-4">
                <span>AGENT CONSOLE: [AutoDev_Agent_v3]</span>
                <span className="text-[#FFD1E3]">00:00:01</span>
              </div>
              <div className="space-y-3 leading-relaxed text-slate-200">
                <p className="text-white/50">$ agentguard --sandbox-mode active</p>
                <p className="text-[#FF94BE]">› Agent initialized with PID: 8109 (LangChain)</p>
                
                {displayedLines.map((line, idx) => (
                  <p 
                    key={idx} 
                    className={
                      line.includes('⛔') || line.includes('CRITICAL') 
                        ? 'text-[#FF1F6B] font-extrabold' 
                        : line.includes('⚠️') 
                        ? 'text-[#FFBD6B] font-bold' 
                        : line.includes('✔') 
                        ? 'text-[#3DDC97] font-bold' 
                        : 'text-slate-200'
                    }
                  >
                    {line}
                  </p>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5 text-white/70">
                    <span className="text-[#FF2D7A]">›</span>
                    <span className="w-2 h-4 bg-[#FF1F6B] inline-block animate-blink"></span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40">
              <span>Runtime: Node 20.x + Python 3.12 Shim</span>
              <button
                onClick={() => runScenario(currentScenarioId)}
                className="text-[#FF1F6B] hover:underline flex items-center gap-1 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay scenario</span>
              </button>
            </div>
          </div>

          {/* Guard Evaluation Panel */}
          <div className="lg:col-span-5 p-6 bg-[#140e13]/95 flex flex-col justify-between relative overflow-hidden">
            {/* Giant BLOCKED Stamp Overlay */}
            {currentDecision === 'BLOCK' && !isTyping && (
              <div className="absolute inset-0 z-30 bg-[#FF1F6B]/15 backdrop-blur-[1px] flex items-center justify-center pointer-events-none transition-all duration-300">
                <div className="transform -rotate-12 border-4 border-[#FF1F6B] px-8 py-3 rounded-lg text-4xl font-extrabold font-mono text-[#FF1F6B] tracking-widest shadow-[0_0_40px_rgba(255,31,107,0.6)] scale-110">
                  BLOCKED
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.08]">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FFD1E3]">
                  Guard Evaluation
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  currentDecision === 'BLOCK'
                    ? 'bg-[#FF1F6B]/30 text-[#FF1F6B] border-[#FF1F6B] animate-pulse'
                    : currentDecision === 'ASK'
                    ? 'bg-[#FFBD6B]/20 text-[#FFBD6B] border-[#FFBD6B]/40'
                    : 'bg-[#3DDC97]/20 text-[#3DDC97] border-[#3DDC97]/40'
                }`}>
                  {currentDecision}
                </span>
              </div>

              {/* Threat Score Bar */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] mb-4">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">Assessed Threat Score:</span>
                  <span className={`font-extrabold text-lg ${
                    currentScore >= 70 ? 'text-[#FF1F6B]' : currentScore >= 30 ? 'text-[#FFBD6B]' : 'text-[#3DDC97]'
                  }`}>
                    {currentScore} / 100
                  </span>
                </div>
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      currentScore >= 70 ? 'bg-[#FF1F6B]' : currentScore >= 30 ? 'bg-[#FFBD6B]' : 'bg-[#3DDC97]'
                    }`}
                    style={{ width: `${currentScore}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-white/30 mt-1">
                  <span>0 Safe</span>
                  <span>30 Ask</span>
                  <span>70+ Block</span>
                </div>
              </div>

              {/* Triggered Heuristics List */}
              <div className="space-y-3 font-mono text-xs">
                <div className="text-[11px] text-white/50 uppercase tracking-wider">
                  Triggered Heuristics:
                </div>
                <div className="space-y-2">
                  {currentHeuristics.map((h, i) => (
                    <div key={i} className="p-2 rounded bg-white/[0.03] border border-white/[0.05] flex items-center justify-between">
                      <span className="text-white/80">{h.name}:</span>
                      <span className={`font-bold ${
                        currentScore >= 70 ? 'text-[#FF1F6B]' : currentScore >= 30 ? 'text-[#FFBD6B]' : 'text-[#3DDC97]'
                      }`}>
                        {h.detail}
                      </span>
                    </div>
                  ))}
                  {currentHeuristics.length === 0 && (
                    <div className="p-2 rounded bg-white/[0.03] text-white/40 text-center">
                      No policy violations detected
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive Human Approval Box (When ASK is triggered) */}
            {(currentDecision === 'ASK' || scenario.requiresApproval) && approvalState === 'pending' && (
              <div className="mt-6 pt-4 border-t border-white/[0.1] bg-[#3A0620]/40 p-3 rounded-xl border border-[#FFBD6B]/40">
                <div className="text-xs font-mono text-[#FFBD6B] mb-2 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Action Requires Operator Authorization</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    className="flex-1 py-2 rounded-lg bg-[#3DDC97] text-[#050204] font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={handleDeny}
                    className="flex-1 py-2 rounded-lg bg-[#FF1F6B] text-white font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Deny</span>
                  </button>
                </div>
              </div>
            )}

            {/* Signed Verification Footer */}
            <div className="pt-4 border-t border-white/[0.06] text-[10px] font-mono text-slate-400 flex justify-between items-center">
              <span>Signed: Ed25519 hash verified</span>
              <span className="text-white/40">Latency: 1.84ms</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
