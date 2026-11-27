import { useEffect, useRef, useState } from 'react'
import { Alert, Settings, fmtTime } from './store'

type Mode = 'idle' | 'holding' | 'checkin' | 'countdown' | 'prevSent' | 'canceled' | 'sos' | 'nolink' | 'safe'
type Props = {
  s: Settings; battery: number; latest?: Alert
  onCheckin: () => void; onPreventiva: () => void; onCancel: (ms: number) => void; onSOS: () => void; onSafe: () => void
  coords: { lat: number; lng: number }
}

export default function Watch({ s, battery, latest, onCheckin, onPreventiva, onCancel, onSOS, onSafe, coords }: Props) {
  const [mode, setMode] = useState<Mode>('idle')
  const [progress, setProgress] = useState(0)
  const [remain, setRemain] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [buzz, setBuzz] = useState(0)
  const [pressed, setPressed] = useState(false)
  const [awake, setAwake] = useState(true)
  const P = useRef({ s, onCheckin, onPreventiva, onCancel, onSOS, onSafe })
  P.current = { s, onCheckin, onPreventiva, onCancel, onSOS, onSafe }
  const R = useRef({ mode: 'idle' as Mode, down: 0, fired: false, hold: 0 as any, tap: 0 as any, cd: 0 as any, cdStart: 0, back: 0 as any, sleep: 0 as any, down2: false })

  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [])
  const go = (m: Mode) => { R.current.mode = m; setMode(m) }
  const vibrate = () => { if (P.current.s.haptic) setBuzz((b) => b + 1) }
  const backToIdle = (ms: number) => { clearTimeout(R.current.back); R.current.back = setTimeout(() => go('idle'), ms) }
  const wake = () => { setAwake(true); clearTimeout(R.current.sleep); R.current.sleep = setTimeout(() => { if (R.current.mode === 'idle') { clearTimeout(R.current.tap); R.current.tap = 0; setAwake(false) } }, 12000) }
  useEffect(() => { wake(); return () => { clearTimeout(R.current.sleep) } }, [])

  const startCountdown = () => {
    const total = P.current.s.countdown * 1000
    R.current.cdStart = Date.now(); setRemain(total); go('countdown'); vibrate()
    clearInterval(R.current.cd)
    R.current.cd = setInterval(() => {
      const left = total - (Date.now() - R.current.cdStart)
      if (left <= 0) {
        clearInterval(R.current.cd); setRemain(0); go('prevSent'); vibrate(); P.current.onPreventiva(); backToIdle(10000)
      } else setRemain(left)
    }, 50)
  }
  const cancel = () => {
    clearInterval(R.current.cd)
    P.current.onCancel(Date.now() - R.current.cdStart); go('canceled'); vibrate(); backToIdle(4500)
  }
  const safe = () => { clearTimeout(R.current.back); P.current.onSafe(); go('safe'); vibrate(); backToIdle(4500) }
  const guardLink = () => {
    if (!P.current.s.paired) { vibrate(); return true }
    if (!P.current.s.connected) { go('nolink'); vibrate(); backToIdle(3500); return true }
    return false
  }

  const tap = () => {
    const r = R.current
    if (r.mode === 'countdown') return cancel()
    if (r.tap) { clearTimeout(r.tap); r.tap = 0; if (!guardLink()) startCountdown(); return }
    r.tap = setTimeout(() => {
      r.tap = 0
      if (guardLink()) return
      go('checkin'); vibrate(); P.current.onCheckin(); backToIdle(9000)
    }, P.current.s.window)
  }

  const down = () => {
    const r = R.current
    if (r.down2) return
    r.down2 = true; setPressed(true)
    if (P.current.s.pocket && !awake) { clearTimeout(r.tap); r.tap = 0; wake(); r.fired = true; r.down = 0; return }
    wake()
    r.down = Date.now(); r.fired = false
    clearTimeout(r.back)
    if (r.mode === 'countdown') return
    if (r.mode !== 'idle') go('idle')
    r.hold = setInterval(() => {
      const t = Date.now() - r.down
      if (t > 450) { if (r.mode !== 'holding') go('holding'); setProgress(Math.min(1, (t - 450) / 2550)) }
      if (t >= 3000) {
        clearInterval(r.hold); r.fired = true; setProgress(0)
        clearTimeout(r.tap); r.tap = 0
        if (guardLink()) return
        go('sos'); vibrate(); P.current.onSOS(); backToIdle(20000)
      }
    }, 40)
  }
  const up = () => {
    const r = R.current
    if (!r.down2) return
    r.down2 = false; setPressed(false); clearInterval(r.hold)
    if (r.fired) return
    const t = Date.now() - r.down
    setProgress(0)
    if (r.mode === 'holding') { go('idle'); return }
    if (t < 450 || r.mode === 'countdown') tap()
  }
  useEffect(() => () => { clearInterval(R.current.hold); clearInterval(R.current.cd); clearTimeout(R.current.tap); clearTimeout(R.current.back) }, [])

  const receipts = latest?.receipts ?? []
  const delivered = receipts.filter((r) => r.status !== 'enviando').length
  const bg = { idle: '#0b0d0f', holding: '#3a0e0e', checkin: '#123a2f', countdown: '#2b1409', prevSent: '#2b1409', canceled: '#1b1e20', sos: '#B91C1C', nolink: '#1b1e20', safe: '#123a2f' }[mode]
  const accent = { idle: '#e8e4da', holding: '#ff8a80', checkin: '#7fd1b9', countdown: '#ff9a6b', prevSent: '#ff9a6b', canceled: '#e8e4da', sos: '#fff', nolink: '#e8e4da', safe: '#7fd1b9' }[mode]
  const C = 2 * Math.PI * 92

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative" style={{ width: 300 }}>
        {/* straps */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-24 w-[150px] h-32 bg-[#23282c] rounded-t-3xl border-x border-t border-black/40 [background-image:repeating-linear-gradient(0deg,transparent_0_9px,rgba(255,255,255,.04)_9px_10px)]" />
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-24 w-[150px] h-32 bg-[#23282c] rounded-b-3xl border-x border-b border-black/40 [background-image:repeating-linear-gradient(0deg,transparent_0_9px,rgba(255,255,255,.04)_9px_10px)]" />
        {/* case */}
        <div className={`relative bg-slate rounded-[64px] p-[18px] border border-black ${buzz ? 'haptic' : ''}`} key={buzz} style={{ boxShadow: 'inset 0 0 0 2px #2b3135, inset 0 0 0 5px #0d0f11' }}>
          {buzz > 0 && <>
            <span className="ring pointer-events-none absolute inset-0 rounded-[64px] border-2" style={{ borderColor: accent }} />
            <span className="ring pointer-events-none absolute inset-0 rounded-[64px] border" style={{ borderColor: accent, animationDelay: '.2s' }} />
          </>}
          {/* screen */}
          <div className="relative rounded-[48px] overflow-hidden transition-colors duration-200" style={{ background: bg, height: 300, color: accent, opacity: awake || mode !== 'idle' ? 1 : .35 }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              {mode === 'idle' && !s.paired && <>
                <div className="w-14 h-14 rounded-full border-2 border-current grid place-items-center opacity-90">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 7H7a4 4 0 000 8h2M15 7h2a4 4 0 010 8h-2" /><path d="M4 20L20 4" /></svg>
                </div>
                <div className="mono text-[10px] tracking-[.2em] mt-4 text-[#ff9a6b]">SIN VINCULAR</div>
                <div className="font-semibold text-lg mt-2 leading-tight">Dispositivo no enlazado a la app</div>
                <div className="text-[12px] opacity-75 mt-2 leading-snug">Vincúlalo desde Configuración en el móvil. Las alertas están desactivadas.</div>
              </>}
              {mode === 'idle' && s.paired && <>
                <div className="mono text-[10px] tracking-[.2em] opacity-70 uppercase">{new Date(now).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                <div className="mono text-[54px] leading-none font-medium mt-1">{new Date(now).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="mono text-[11px] mt-3 flex gap-3 opacity-90">
                  <span className="flex items-center gap-1.5"><i className={`w-1.5 h-1.5 rounded-full ${s.connected ? 'bg-[#7fd1b9]' : 'bg-[#ff9a6b] blink'}`} />{s.connected ? 'ENLAZADO' : 'SIN ENLACE'}</span>
                  <span>{battery}%</span>
                </div>
                {s.connected
                  ? <div className="mono text-[9px] mt-4 tracking-widest opacity-50 leading-4">1× CHECK-IN<br />2× PREVENTIVA<br />3 s SOS</div>
                  : <div className="mono text-[10px] mt-4 tracking-wider leading-4 text-[#ff9a6b] border border-[#ff9a6b]/60 px-2.5 py-1.5">BLUETOOTH DEL MÓVIL<br />NO ACTIVADO</div>}
              </>}
              {mode === 'holding' && <>
                <svg className="absolute inset-0 m-auto -rotate-90" width="230" height="230"><circle cx="115" cy="115" r="92" fill="none" stroke="#ffffff22" strokeWidth="8" /><circle cx="115" cy="115" r="92" fill="none" stroke="#ff6b60" strokeWidth="8" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} strokeLinecap="butt" /></svg>
                <div className="mono text-[11px] tracking-[.2em]">MANTÉN PARA SOS</div>
                <div className="mono text-5xl font-medium mt-1">{Math.max(0, 3 - (0.45 + progress * 2.55)).toFixed(1)}</div>
                <div className="text-[11px] opacity-80 mt-1">Suelta para abortar</div>
              </>}
              {mode === 'checkin' && <>
                <div className="w-12 h-12 rounded-full border-2 border-current grid place-items-center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></div>
                <div className="font-semibold text-lg mt-3 leading-tight">Check-in enviado</div>
                <div className="text-[12px] opacity-90 mt-1">En camino</div>
                <div className="mono text-[11px] mt-3 opacity-80">{delivered}/{receipts.length || '·'} entregados</div>
                <button onClick={safe} className="relative mt-3 min-h-[48px] w-[210px] bg-[#f5f3ee] text-slate text-[14px] font-bold px-5 py-3 rounded-full active:scale-95">Estoy a salvo · Falsa alarma</button>
              </>}
              {mode === 'countdown' && <>
                <div className="mono text-[10px] tracking-[.2em]">ALERTA PREVENTIVA</div>
                <div className="mono text-6xl font-bold leading-none mt-1">{Math.ceil(remain / 1000)}</div>
                <button onClick={cancel} className="relative mt-4 w-[210px] min-h-[52px] bg-[#f5f3ee] text-slate text-[16px] font-bold px-6 py-3.5 rounded-full active:scale-95">Cancelar alerta</button>
              </>}
              {mode === 'prevSent' && <>
                <div className="mono text-[10px] tracking-[.2em]">NIVEL 2 · NOTIFICADO</div>
                <div className="font-semibold text-lg mt-2 leading-tight">Alerta preventiva enviada</div>
                <div className="mono text-[11px] mt-3 opacity-90">{delivered}/{receipts.length || '·'} contactos</div>
                <div className="mono text-[10px] mt-1 opacity-70">{fmtTime(latest?.ts ?? now)}</div>
                <button onClick={safe} className="relative mt-3 min-h-[48px] w-[210px] bg-[#f5f3ee] text-slate text-[14px] font-bold px-5 py-3 rounded-full active:scale-95">Estoy a salvo · Falsa alarma</button>
              </>}
              {mode === 'canceled' && <>
                <div className="w-12 h-12 rounded-full border-2 border-current grid place-items-center"><svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M6 6l12 12M18 6L6 18" /></svg></div>
                <div className="font-semibold text-lg mt-3">Alerta cancelada</div>
                <div className="text-[12px] opacity-80 mt-1">Nadie ha sido avisado</div>
              </>}
              {mode === 'sos' && <>
                <div className="mono text-[11px] tracking-[.25em] blink">● SOS ACTIVO</div>
                <div className="font-bold text-2xl mt-2 leading-tight">Ayuda en camino a tu aviso</div>
                <div className="mono text-[10px] mt-3 leading-4 opacity-95">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}<br />BAT {battery}% · NIVEL 3</div>
                <div className="mono text-[12px] mt-2 font-bold">{delivered}/{receipts.length || '·'} ENTREGADOS</div>
                <button onClick={safe} className="relative mt-3 min-h-[48px] w-[210px] bg-white text-[#B91C1C] text-[14px] font-bold px-5 py-3 rounded-full active:scale-95">Estoy a salvo · Falsa alarma</button>
              </>}
              {mode === 'safe' && <>
                <div className="w-12 h-12 rounded-full border-2 border-current grid place-items-center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></div>
                <div className="font-semibold text-lg mt-3 leading-tight">Marcado a salvo</div>
                <div className="text-[12px] opacity-90 mt-1">Tus contactos han sido avisados</div>
              </>}
              {mode === 'nolink' && <>
                <div className="w-12 h-12 rounded-full border-2 border-current grid place-items-center text-[#ff9a6b]"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7l10 10-5 5V2l5 5L7 17" /><path d="M3 3l18 18" /></svg></div>
                <div className="mono text-[10px] tracking-[.2em] text-[#ff9a6b] mt-3">BLUETOOTH DESACTIVADO</div>
                <div className="font-semibold text-lg mt-2 leading-tight">Bluetooth del móvil no activado</div>
                <div className="text-[12px] opacity-80 mt-1">No se envió. Actívalo en el móvil para enviar alertas.</div>
              </>}
            </div>
          </div>
          {/* side button */}
          <button
            aria-label="Botón lateral del reloj: pulsación corta, doble o mantenida"
            onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); down() }}
            onPointerUp={up} onPointerCancel={up}
            onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); down() } }}
            onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); up() } }}
            className="absolute -right-[14px] top-[108px] w-[18px] h-[84px] rounded-r-md border border-black touch-none"
            style={{ background: pressed ? '#C85A32' : 'linear-gradient(90deg,#3a4146,#22272b)', transform: pressed ? 'translateX(-5px)' : 'none', transition: 'transform .06s' }}
          >
            <span className="absolute inset-y-3 left-1/2 w-px bg-white/20" />
          </button>
        </div>
      </div>
      <div className="mt-[124px] flex flex-col items-center gap-1.5">
        <button onClick={() => { clearTimeout(R.current.sleep); clearTimeout(R.current.tap); R.current.tap = 0; clearTimeout(R.current.back); if (R.current.mode !== 'idle') go('idle'); setAwake(false) }} disabled={!awake && mode === 'idle'} className="border border-line bg-paper text-[13px] font-semibold px-4 py-2.5 min-h-[44px] disabled:opacity-50">{awake || mode !== 'idle' ? 'Poner en reposo' : 'Reloj en reposo'}</button>
      </div>
    </div>
  )
}
