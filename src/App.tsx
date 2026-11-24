import { useCallback, useEffect, useRef, useState } from 'react'
import Watch from './Watch'
import Phone, { Tab } from './Phone'
import { Alert, Contact, KIND_COLOR, KIND_LABEL, Kind, SEED_ALERTS, SEED_CONTACTS, Settings, TIER, fmtCoord, fmtTime } from './store'

type Log = { id: number; t: number; text: string; c?: string }

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>(SEED_CONTACTS)
  const [alerts, setAlerts] = useState<Alert[]>(SEED_ALERTS)
  const [s, setS] = useState<Settings>({ location: 'alert', haptic: true, hold: true, pocket: false, window: 450, countdown: 5, connected: true, paired: true })
  const [tab, setTab] = useState<Tab>('inicio')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [unread, setUnread] = useState(0)
  const [toast, setToast] = useState<{ kind: Kind; text: string } | null>(null)
  const [coords, setCoords] = useState({ lat: 40.41679, lng: -3.70379 })
  const [battery, setBattery] = useState(78)
  const [searching, setSearching] = useState(false)
  const [view, setView] = useState<'ambos' | 'reloj' | 'app'>('ambos')
  const [log, setLog] = useState<Log[]>([{ id: 0, t: Date.now(), text: 'Simulador iniciado · reloj emparejado por BLE' }])
  const R = useRef({ contacts, s, coords, battery, tab })
  R.current = { contacts, s, coords, battery, tab }

  useEffect(() => {
    const i = setInterval(() => setCoords((c) => ({ lat: c.lat + (Math.random() - 0.4) * 0.00004, lng: c.lng + (Math.random() - 0.4) * 0.00004 })), 1500)
    const b = setInterval(() => setBattery((x) => Math.max(5, x - 1)), 60000)
    return () => { clearInterval(i); clearInterval(b) }
  }, [])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4500); return () => clearTimeout(t) } }, [toast])
  useEffect(() => { if (tab === 'alertas') setUnread(0) }, [tab, alerts.length])

  const addLog = useCallback((text: string, c?: string) => setLog((l) => [{ id: Date.now() + Math.random(), t: Date.now(), text, c }, ...l].slice(0, 40)), [])

  const create = (kind: Kind, note: string) => {
    const { contacts, s, coords, battery } = R.current
    const id = 'n' + Date.now()
    const recips = kind === 'cancelada' ? [] : contacts.filter((c) => c[kind])
    const share = kind !== 'checkin' || s.location === 'checkin'
    const alert: Alert = { id, kind, ts: Date.now(), lat: share ? coords.lat : NaN, lng: share ? coords.lng : NaN, battery, tier: TIER[kind], source: 'Reloj', note,
      receipts: recips.map((c) => ({ contactId: c.id, name: c.name, status: 'enviando' as const })) }
    setAlerts((a) => [alert, ...a])
    if (R.current.tab !== 'alertas') setUnread((u) => u + 1)
    setToast({ kind, text: kind === 'cancelada' ? 'Alerta cancelada desde el reloj' : `${KIND_LABEL[kind]} recibido desde el reloj` })
    addLog(`WATCH→PHONE ${KIND_LABEL[kind].toUpperCase()} · N${TIER[kind]}${share ? ' · ' + coords.lat.toFixed(4) + ',' + coords.lng.toFixed(4) : ' · sin ubicación'}`, KIND_COLOR[kind])
    if (kind !== 'cancelada' && !recips.length) addLog('Sin contactos asignados a este nivel', '#C85A32')
    recips.forEach((c, i) => {
      const upd = (status: 'entregado' | 'leído') => setAlerts((l) => l.map((a) => a.id !== id ? a : { ...a, receipts: a.receipts.map((r) => r.contactId === c.id ? { ...r, status, at: Date.now() } : r) }))
      setTimeout(() => { upd('entregado'); addLog(`ENTREGADO a ${c.name} (SMS + push)`, '#2E6F5E') }, (kind === 'sos' ? 500 : 900) + i * 600)
      if (kind !== 'checkin' || i === 0) setTimeout(() => { upd('leído'); addLog(`LEÍDO por ${c.name}`) }, 3500 + i * 1500 + Math.random() * 1500)
    })
  }

  const ctx = {
    tab, setTab, contacts, setContacts: (f: (c: Contact[]) => Contact[]) => setContacts(f), alerts, s, setS: (f: (s: Settings) => Settings) => setS(f), battery, coords, detailId, setDetailId, unread, toast, searching,
    pair: () => { setSearching(true); addLog('Buscando SafeBand S1 por BLE…'); setTimeout(() => { setSearching(false); setS((x) => ({ ...x, paired: true, connected: true })); addLog('Reloj vinculado', '#2E6F5E') }, 2000) },
    unpair: () => { setS((x) => ({ ...x, paired: false, connected: false })); addLog('Reloj desvinculado', '#C85A32') },
    clearHistory: () => { setAlerts([]); setDetailId(null) },
  }
  useEffect(() => { addLog(s.connected ? 'Enlace BLE restablecido' : 'Enlace BLE perdido', s.connected ? '#2E6F5E' : '#C85A32') }, [s.connected])

  const latest = alerts[0]
  const lastDone = latest?.receipts.filter((r) => r.status !== 'enviando').length ?? 0

  return (
    <div className="min-h-screen">
      <header className="bg-slate text-stone">
        <div className="max-w-[1180px] mx-auto px-5 py-3 flex flex-wrap items-center gap-x-8 gap-y-2">
          <div className="flex items-center gap-2.5"><span className="w-5 h-5 border-2 border-stone grid place-items-center"><i className="w-1.5 h-1.5 bg-amber" /></span><b className="tracking-[.14em] text-sm">SAFEBAND</b></div>
          <div className="mono text-[11px] flex flex-wrap gap-x-6 gap-y-1 opacity-95 flex-1" aria-label="Simulación IoT">
            <span className="text-amber font-bold tracking-widest">SIMULACIÓN IoT</span>
            <span className="flex items-center gap-1.5"><i className={`w-1.5 h-1.5 rounded-full ${s.connected ? 'bg-[#7fd1b9]' : 'bg-amber blink'}`} />ENLACE {s.connected ? 'BLE OK' : 'CAÍDO'}</span>
            <span>GPS {fmtCoord(coords.lat, 'N', 'S')} · {fmtCoord(coords.lng, 'E', 'O')}</span>
            <span>BAT {battery}%</span>
            <span>NOTIF {latest && latest.receipts.length ? `${lastDone}/${latest.receipts.length} ENTREGADAS` : 'SIN PENDIENTES'}</span>
          </div>
          <div className="flex lg:hidden border border-stone/30" role="tablist">{(['ambos', 'reloj', 'app'] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-xs capitalize ${view === v ? 'bg-stone text-slate' : ''}`}>{v === 'app' ? 'App' : v}</button>)}</div>
        </div>
      </header>

      <main className="max-w-[1180px] mx-auto px-5 py-10 grid lg:grid-cols-[minmax(0,1fr)_380px] gap-12 items-start justify-items-center">
        <section className={`w-full ${view === 'app' ? 'hidden lg:block' : ''}`}>
          <div className="mono text-[11px] tracking-[.18em] text-ink-soft">01 / DISPOSITIVO</div>
          <h2 className="text-[26px] font-bold leading-tight mt-1 mb-1">Smartwatch en muñeca — Simulación IoT</h2>
          <p className="text-[14px] text-ink-soft max-w-md">Usa el botón físico del lateral derecho. Funciona con ratón, táctil o la barra espaciadora.</p>

          <div className="grid-bg border border-line bg-stone my-8 py-28 flex justify-center"><Watch s={s} battery={battery} latest={latest} coords={coords} onCheckin={() => create('checkin', `En camino · ${s.location === 'checkin' ? 'Ubicación enviada' : 'Sin ubicación'}`)} onPreventiva={() => create('preventiva', `Cuenta atrás de ${s.countdown} s completada sin cancelar`)} onCancel={(ms) => create('cancelada', `Cancelada a los ${(ms / 1000).toFixed(1)} s · antes de notificar`)} onSOS={() => create('sos', 'Pulsación mantenida 3 s · escalada máxima')} /></div>

          <div className="grid sm:grid-cols-3 border border-line bg-paper divide-y sm:divide-y-0 sm:divide-x divide-line">
            {[['1 pulsación corta', 'Check-in silencioso', 'Avisa «En camino». Sin ubicación por defecto; con «También en check-in» la envía.', '#2E6F5E'], ['2 pulsaciones rápidas', 'Preventiva cancelable', 'Cuenta atrás en el dial. Pulsa o toca «Cancelar alerta».', '#C85A32'], ['Mantener 3 segundos', 'SOS inmediato', 'Envía ubicación, hora, batería y nivel 3 a todos los de emergencia.', '#B91C1C']].map(([g, t, d, c]) => (
              <div key={t} className="p-4"><div className="mono text-[11px] font-bold uppercase tracking-wider" style={{ color: c }}>{g}</div><div className="font-semibold mt-1">{t}</div><p className="text-[12px] text-ink-soft mt-1 leading-snug">{d}</p></div>))}
          </div>

          <div className="mt-6 bg-slate text-stone p-4">
            <div className="mono text-[10px] tracking-[.2em] opacity-60 mb-2">REGISTRO DE TELEMETRÍA</div>
            <div className="mono text-[12px] h-[132px] overflow-y-auto space-y-1" aria-live="polite">{log.map((l) => <div key={l.id} className="flex gap-3"><span className="opacity-50 shrink-0">{fmtTime(l.t)}</span><span style={{ color: l.c ?? '#e8e4da' }}>{l.text}</span></div>)}</div>
          </div>
        </section>

        <section className={`${view === 'reloj' ? 'hidden lg:block' : ''}`}>
          <div className="mono text-[11px] tracking-[.18em] text-ink-soft">02 / APP COMPAÑERA</div>
          <h2 className="text-[26px] font-bold leading-tight mt-1 mb-6">Móvil · Safeband</h2>
          <Phone c={ctx} />
        </section>
      </main>
    </div>
  )
}
