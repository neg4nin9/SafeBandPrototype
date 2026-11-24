import { ReactNode, useState } from 'react'
import { Alert, Contact, Kind, KIND_COLOR, KIND_LABEL, Settings, fmtCoord, fmtDate, fmtTime } from './store'

export type Tab = 'inicio' | 'contactos' | 'alertas' | 'config'
export type Ctx = {
  tab: Tab; setTab: (t: Tab) => void
  contacts: Contact[]; setContacts: (f: (c: Contact[]) => Contact[]) => void
  alerts: Alert[]; s: Settings; setS: (f: (s: Settings) => Settings) => void
  battery: number; coords: { lat: number; lng: number }
  detailId: string | null; setDetailId: (id: string | null) => void
  unread: number; toast: { kind: Kind; text: string } | null
  searching: boolean; pair: () => void; unpair: () => void
  clearHistory: () => void
}

const I = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square"><path d={d} /></svg>
)
const ICON = {
  inicio: 'M3 11l9-7 9 7v9H3z M9 20v-6h6v6',
  contactos: 'M8 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16 5a3 3 0 010 6 M18 14c2.2.6 4 2.6 4 6',
  alertas: 'M6 17V11a6 6 0 0112 0v6l2 2H4z M10 21h4',
  config: 'M4 7h10 M18 7h2 M4 17h2 M10 17h10 M16 5v4 M8 15v4',
  back: 'M15 5l-7 7 7 7', plus: 'M12 5v14M5 12h14', close: 'M6 6l12 12M18 6L6 18', check: 'M5 12.5l4.5 4.5L19 7.5', pin: 'M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z M12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  chev: 'M9 5l7 7-7 7', phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
}
const Ico = ({ n, size }: { n: keyof typeof ICON; size?: number }) => <I d={ICON[n]} size={size} />

const Label = ({ children }: { children: ReactNode }) => <div className="mono text-[10px] uppercase tracking-[.16em] text-ink-soft">{children}</div>
const Section = ({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) => (
  <section className="mt-6"><div className="flex items-end justify-between border-b border-pine pb-1.5 mb-3"><h2 className="text-[13px] font-bold uppercase tracking-[.08em]">{title}</h2>{right}</div>{children}</section>
)
const Tag = ({ kind }: { kind: Kind }) => (
  <span className="mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border" style={{ color: KIND_COLOR[kind], borderColor: KIND_COLOR[kind] }}>N{kind === 'checkin' ? 1 : kind === 'sos' ? 3 : 2}</span>
)
const Toggle = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`shrink-0 w-11 h-6 border relative transition-colors ${on ? 'bg-pine border-pine' : 'bg-transparent border-ink-soft'}`}>
    <span className={`absolute top-[3px] w-4 h-4 transition-all ${on ? 'left-[23px] bg-stone' : 'left-[3px] bg-ink-soft'}`} />
  </button>
)
const Initials = ({ name, size = 40 }: { name: string; size?: number }) => (
  <div className="bg-pine text-stone grid place-items-center font-semibold shrink-0" style={{ width: size, height: size, fontSize: size / 3 }}>{name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
)

const TIERS: { k: 'checkin' | 'preventiva' | 'sos'; short: string; color: string }[] = [
  { k: 'checkin', short: 'Check-in', color: '#2E6F5E' }, { k: 'preventiva', short: 'Preventiva', color: '#C85A32' }, { k: 'sos', short: 'SOS', color: '#B91C1C' },
]

function MapPin({ lat, lng, shared = true }: { lat: number; lng: number; shared?: boolean }) {
  const x = 40 + ((Math.abs(lng) * 1e5) % 50), y = 30 + ((Math.abs(lat) * 1e5) % 40)
  return (
    <div className="relative border border-line bg-[#ece8de] overflow-hidden" style={{ height: 150 }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <g stroke="#d6d1c7" strokeWidth=".8" fill="none"><path d="M0 22H100M0 48H100M0 74H100M18 0V100M46 0V100M72 0V100" /></g>
        <path d="M0 90C30 70 55 80 100 40" stroke="#bcd0c8" strokeWidth="5" fill="none" />
        <path d="M0 35L100 62M30 0L60 100" stroke="#cfc9bb" strokeWidth="1.6" fill="none" />
        <rect x="50" y="2" width="22" height="18" fill="#d5dfd3" />
      </svg>
      {shared ? <>
        <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${x}%`, top: `${y}%`, color: '#B91C1C' }}><Ico n="pin" size={28} /></div>
        <div className="absolute w-3 h-3 rounded-full border border-slate/50 -translate-x-1/2 -translate-y-1/2 bg-slate/30" style={{ left: `${x}%`, top: `${y}%` }} />
      </> : <div className="absolute inset-0 grid place-items-center bg-stone/80 text-[12px] text-ink-soft">Ubicación no compartida en este nivel</div>}
      <div className="absolute left-2 bottom-1.5 mono text-[9px] text-ink-soft">SIMULADO · 1:2 500</div>
    </div>
  )
}

/* ---------- Inicio ---------- */
function Inicio({ c }: { c: Ctx }) {
  const last = c.alerts[0]
  const status = !c.s.paired ? 'No vinculado' : c.s.connected ? 'Emparejado' : 'Sin enlace'
  const col = !c.s.paired || !c.s.connected ? '#C85A32' : '#2E6F5E'
  return (
    <div className="px-5 pb-6">
      <div className="pt-3"><Label>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Label>
        <h1 className="text-[26px] font-bold leading-tight mt-1">Hola, Elena.<br /><span className="font-normal text-ink-soft">Todo listo para tu trayecto.</span></h1></div>

      <div className="mt-5 border border-pine bg-paper">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div><Label>Reloj vinculado</Label><div className="font-semibold mt-0.5">SafeBand S1 · Muñeca izq.</div></div>
          <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: col }}><i className={`w-2 h-2 rounded-full ${c.s.connected ? '' : 'blink'}`} style={{ background: col }} />{status}</div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-line">
          {[['Batería', `${c.battery}%`], ['Señal BLE', c.s.connected ? '−54 dBm' : '—'], ['GPS', c.s.connected ? '±4 m' : '—']].map(([k, v]) => (
            <div key={k} className="px-4 py-3"><Label>{k}</Label><div className="mono text-lg font-medium mt-0.5">{v}</div></div>))}
        </div>
        <div className="h-1.5 bg-line"><div className="h-full bg-sage" style={{ width: `${c.battery}%` }} /></div>
      </div>

      <Section title="Niveles de escalada">
        <div className="border border-line divide-y divide-line bg-paper">
          {[{ k: 'checkin', n: 1, g: '1 pulsación corta', t: 'Check-in silencioso' }, { k: 'preventiva', n: 2, g: '2 pulsaciones rápidas', t: `Preventiva · ${c.s.countdown} s cancelable` }, { k: 'sos', n: 3, g: 'Mantener 3 s', t: 'SOS inmediato' }].map((r) => {
            const num = c.contacts.filter((x) => x[r.k as 'sos']).length
            return (
              <div key={r.k} className="flex items-center gap-3 px-3 py-2.5">
                <div className="mono w-7 h-7 grid place-items-center text-[12px] text-white font-bold" style={{ background: KIND_COLOR[r.k as Kind] }}>{r.n}</div>
                <div className="flex-1 min-w-0"><div className="text-[14px] font-semibold leading-tight">{r.t}</div><div className="mono text-[11px] text-ink-soft">{r.g}</div></div>
                <div className="text-right"><div className="mono text-[13px] font-medium">{num}</div><div className="text-[10px] text-ink-soft">contactos</div></div>
              </div>)
          })}
        </div>
        {c.contacts.filter((x) => x.sos).length === 0 && <p className="text-[12px] mt-2 text-amber font-semibold">Ningún contacto recibirá el SOS. Añade uno en Contactos.</p>}
      </Section>

      <Section title="Último aviso" right={<button onClick={() => { c.setDetailId(last?.id ?? null); c.setTab('alertas') }} className="text-[12px] underline">Ver historial</button>}>
        {last ? (
          <button onClick={() => { c.setDetailId(last.id); c.setTab('alertas') }} className="w-full text-left border bg-paper p-3 flex gap-3 items-start" style={{ borderColor: KIND_COLOR[last.kind] }}>
            <div className="w-1.5 self-stretch" style={{ background: KIND_COLOR[last.kind] }} />
            <div className="flex-1">
              <div className="flex items-center gap-2"><span className="font-semibold">{KIND_LABEL[last.kind]}</span><Tag kind={last.kind} /></div>
              <div className="mono text-[12px] text-ink-soft mt-1">{fmtDate(last.ts)} · {fmtTime(last.ts)}</div>
              <div className="text-[12px] mt-1">{last.receipts.length ? `${last.receipts.filter((r) => r.status !== 'enviando').length} de ${last.receipts.length} contactos con entrega confirmada` : 'Sin notificaciones enviadas'}</div>
            </div><Ico n="chev" />
          </button>) : <p className="text-[13px] text-ink-soft">Aún no hay avisos.</p>}
      </Section>

      <Section title="Contactos de confianza" right={<button onClick={() => c.setTab('contactos')} className="text-[12px] underline">Gestionar</button>}>
        <div className="flex gap-3 overflow-x-auto">
          {c.contacts.map((x) => (
            <div key={x.id} className="w-[72px] shrink-0 text-center"><div className="mx-auto w-fit"><Initials name={x.name} size={48} /></div><div className="text-[12px] mt-1.5 font-medium leading-tight">{x.name.split(' ')[0]}</div><div className="text-[10px] text-ink-soft">{x.rel.split(' · ')[0]}</div></div>))}
          <button onClick={() => c.setTab('contactos')} className="w-12 h-12 border border-dashed border-pine grid place-items-center shrink-0" aria-label="Añadir contacto"><Ico n="plus" /></button>
        </div>
      </Section>
    </div>
  )
}

/* ---------- Contactos ---------- */
const blank = { name: '', rel: 'Familia', phone: '', checkin: true, preventiva: true, sos: true }
function Contactos({ c }: { c: Ctx }) {
  const [edit, setEdit] = useState<Contact | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const toggle = (id: string, k: 'checkin' | 'preventiva' | 'sos') => c.setContacts((l) => l.map((x) => (x.id === id ? { ...x, [k]: !x[k] } : x)))
  const open = (x: Contact | null) => { setErr(''); setConfirmDel(false); setIsNew(!x); setEdit(x ? { ...x } : { id: 'c' + Date.now(), ...blank }) }
  const save = () => {
    if (!edit) return
    if (edit.name.trim().length < 2) return setErr('Escribe el nombre del contacto.')
    if (edit.phone.replace(/\D/g, '').length < 9) return setErr('El teléfono debe tener al menos 9 dígitos.')
    c.setContacts((l) => (isNew ? [...l, edit] : l.map((x) => (x.id === edit.id ? edit : x))))
    setEdit(null)
  }
  return (
    <div className="px-5 pb-6">
      <div className="pt-3 flex items-end justify-between"><h1 className="text-[24px] font-bold">Contactos</h1><button onClick={() => open(null)} className="bg-pine text-stone text-[13px] font-semibold px-3 py-2 flex items-center gap-1.5"><Ico n="plus" size={16} />Añadir</button></div>
      <p className="text-[13px] text-ink-soft mt-1">Elige quién recibe cada nivel. Los cambios se aplican al reloj al instante.</p>
      <div className="mt-4 space-y-3">
        {c.contacts.length === 0 && <div className="border border-dashed border-pine p-6 text-center text-[13px]">No tienes contactos de confianza. Añade al menos uno para que el SOS llegue a alguien.</div>}
        {c.contacts.map((x) => (
          <div key={x.id} className="border border-line bg-paper">
            <div className="flex items-center gap-3 p-3">
              <Initials name={x.name} />
              <div className="flex-1 min-w-0"><div className="font-semibold leading-tight truncate">{x.name}</div><div className="text-[12px] text-ink-soft">{x.rel}</div><div className="mono text-[12px]">{x.phone}</div></div>
              <button onClick={() => open(x)} className="text-[12px] font-semibold border border-pine px-2.5 py-1.5">Editar</button>
            </div>
            <div className="grid grid-cols-3 border-t border-line">
              {TIERS.map((t) => (
                <button key={t.k} aria-pressed={x[t.k]} onClick={() => toggle(x.id, t.k)} className="py-2 text-[11px] font-semibold flex items-center justify-center gap-1.5 border-r border-line last:border-r-0" style={x[t.k] ? { background: t.color, color: '#fff' } : { color: '#4a4f4b' }}>
                  {x[t.k] ? <Ico n="check" size={13} /> : <span className="w-3 h-3 border border-ink-soft" />}{t.short}</button>))}
            </div>
          </div>))}
      </div>
      {edit && (
        <div className="absolute inset-0 z-20 flex items-end bg-slate/55">
          <div className="slidein w-full bg-stone border-t border-pine p-5 max-h-full overflow-y-auto">
            <div className="flex justify-between items-center"><h2 className="text-lg font-bold">{isNew ? 'Nuevo contacto' : 'Editar contacto'}</h2><button onClick={() => setEdit(null)} aria-label="Cerrar"><Ico n="close" /></button></div>
            <label className="block mt-3"><Label>Nombre</Label><input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Nombre y apellido" className="w-full mt-1 border border-line bg-paper px-3 py-2.5 text-[15px]" /></label>
            <label className="block mt-3"><Label>Teléfono</Label><input value={edit.phone} inputMode="tel" onChange={(e) => setEdit({ ...edit, phone: e.target.value })} placeholder="+34 600 000 000" className="mono w-full mt-1 border border-line bg-paper px-3 py-2.5 text-[15px]" /></label>
            <label className="block mt-3"><Label>Relación</Label>
              <select value={edit.rel} onChange={(e) => setEdit({ ...edit, rel: e.target.value })} className="w-full mt-1 border border-line bg-paper px-3 py-2.5 text-[15px]">{['Pareja', 'Familia', 'Amistad', 'Trabajo'].map((o) => <option key={o}>{o}</option>)}</select></label>
            <div className="mt-3"><Label>Recibe</Label>
              <div className="grid grid-cols-3 mt-1 border border-line">{TIERS.map((t) => (
                <button key={t.k} aria-pressed={edit[t.k]} onClick={() => setEdit({ ...edit, [t.k]: !edit[t.k] })} className="py-2.5 text-[12px] font-semibold border-r border-line last:border-r-0" style={edit[t.k] ? { background: t.color, color: '#fff' } : { background: '#fbfaf7' }}>{t.short}</button>))}</div></div>
            {err && <p role="alert" className="text-crimson text-[13px] font-semibold mt-3">{err}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={save} className="flex-1 bg-pine text-stone font-semibold py-3">Guardar</button>
              {!isNew && (confirmDel
                ? <button onClick={() => { c.setContacts((l) => l.filter((x) => x.id !== edit.id)); setEdit(null) }} className="bg-crimson text-white font-semibold px-4">Confirmar</button>
                : <button onClick={() => setConfirmDel(true)} className="border border-crimson text-crimson font-semibold px-4">Eliminar</button>)}
            </div>
          </div>
        </div>)}
    </div>
  )
}

/* ---------- Alertas ---------- */
const FILTERS: { k: Kind | 'todos'; l: string }[] = [{ k: 'todos', l: 'Todos' }, { k: 'checkin', l: 'Check-in' }, { k: 'preventiva', l: 'Preventivas' }, { k: 'cancelada', l: 'Canceladas' }, { k: 'sos', l: 'SOS' }]
const STATUS_COL = { enviando: '#C85A32', entregado: '#2E6F5E', 'leído': '#1E3A2F' }
function Alertas({ c }: { c: Ctx }) {
  const [f, setF] = useState<Kind | 'todos'>('todos')
  const detail = c.alerts.find((a) => a.id === c.detailId)
  if (detail) {
    const shared = !Number.isNaN(detail.lat)
    return (
      <div className="px-5 pb-6">
        <button onClick={() => c.setDetailId(null)} className="flex items-center gap-1 text-[13px] font-semibold pt-3"><Ico n="back" size={16} />Historial</button>
        <div className="mt-3 p-4 text-white" style={{ background: KIND_COLOR[detail.kind] }}>
          <div className="mono text-[10px] tracking-[.18em] uppercase opacity-90">Nivel {detail.tier} · {detail.source}</div>
          <div className="text-[22px] font-bold leading-tight mt-1">{KIND_LABEL[detail.kind]}</div>
          <div className="mono text-[13px] mt-1">{fmtDate(detail.ts)} · {fmtTime(detail.ts)}</div>
        </div>
        <p className="text-[14px] mt-3">{detail.note}</p>
        <Section title="Ubicación"><MapPin lat={detail.lat} lng={detail.lng} shared={shared} />
          {shared && <div className="mono text-[12px] mt-2 grid grid-cols-2 gap-1"><span>{fmtCoord(detail.lat, 'N', 'S')}</span><span>{fmtCoord(detail.lng, 'E', 'O')}</span></div>}</Section>
        <Section title="Datos del reloj"><div className="grid grid-cols-3 border border-line bg-paper divide-x divide-line">
          {[['Batería', `${detail.battery}%`], ['Nivel', `N${detail.tier}`], ['Origen', detail.source]].map(([k, v]) => <div key={k} className="p-2.5"><Label>{k}</Label><div className="mono font-medium mt-0.5">{v}</div></div>)}</div></Section>
        <Section title="Recepción por contacto">
          {detail.receipts.length === 0 ? <p className="text-[13px] text-ink-soft border border-line bg-paper p-3">{detail.kind === 'cancelada' ? 'Cancelada antes de notificar. Ningún contacto recibió aviso.' : 'No había contactos asignados a este nivel.'}</p> :
            <div className="border border-line bg-paper divide-y divide-line">{detail.receipts.map((r) => (
              <div key={r.contactId} className="flex items-center gap-3 p-3"><Initials name={r.name} size={32} /><div className="flex-1 text-[14px] font-medium">{r.name}</div>
                <span className="mono text-[11px] uppercase font-bold" style={{ color: STATUS_COL[r.status] }}>{r.status === 'enviando' && <span className="blink">● </span>}{r.status}</span></div>))}</div>}
        </Section>
      </div>)
  }
  const list = c.alerts.filter((a) => f === 'todos' || a.kind === f)
  return (
    <div className="px-5 pb-6">
      <div className="pt-3 flex items-end justify-between"><h1 className="text-[24px] font-bold">Alertas</h1><span className="mono text-[11px] text-ink-soft flex items-center gap-1.5"><i className="w-1.5 h-1.5 rounded-full bg-sage" />EN VIVO</span></div>
      <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">{FILTERS.map((x) => (
        <button key={x.k} aria-pressed={f === x.k} onClick={() => setF(x.k)} className={`shrink-0 text-[12px] font-semibold px-3 py-1.5 border ${f === x.k ? 'bg-pine text-stone border-pine' : 'border-line bg-paper'}`}>{x.l}</button>))}</div>
      <div className="mt-3 border-t border-pine">
        {list.length === 0 && <p className="text-[13px] text-ink-soft py-6 text-center">No hay eventos de este tipo.</p>}
        {list.map((a) => {
          const done = a.receipts.filter((r) => r.status !== 'enviando').length
          return (
            <button key={a.id} onClick={() => c.setDetailId(a.id)} className="w-full text-left flex items-stretch gap-3 py-3 border-b border-line">
              <div className="w-1 shrink-0" style={{ background: KIND_COLOR[a.kind] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="font-semibold text-[14px]">{KIND_LABEL[a.kind]}</span><Tag kind={a.kind} /></div>
                <div className="mono text-[11px] text-ink-soft mt-0.5">{fmtDate(a.ts)} · {fmtTime(a.ts)}</div>
                <div className="text-[12px] mt-1 truncate">{a.receipts.length ? `${done}/${a.receipts.length} entregados` : a.kind === 'cancelada' ? 'Nadie notificado' : 'Sin destinatarios'}</div>
              </div><Ico n="chev" size={16} />
            </button>)
        })}
      </div>
      <button onClick={c.clearHistory} className="text-[12px] underline text-ink-soft mt-4">Borrar historial de la simulación</button>
    </div>
  )
}

/* ---------- Config ---------- */
function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return <div className="flex items-start gap-3 py-3 border-b border-line last:border-0"><div className="flex-1"><div className="text-[14px] font-semibold leading-tight">{title}</div>{desc && <div className="text-[12px] text-ink-soft mt-0.5 leading-snug">{desc}</div>}</div>{children}</div>
}
function Config({ c }: { c: Ctx }) {
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => c.setS((s) => ({ ...s, [k]: v }))
  return (
    <div className="px-5 pb-8">
      <h1 className="text-[24px] font-bold pt-3">Configuración</h1>
      <Section title="Ubicación">
        <div className="border border-line bg-paper">{([['alert', 'Solo al alertar', 'Se comparte únicamente en preventivas y SOS. Los check-in no llevan ubicación.'], ['checkin', 'También en check-in', 'Cada check-in incluye tu posición aproximada.']] as const).map(([k, t, d]) => (
          <button key={k} role="radio" aria-checked={c.s.location === k} onClick={() => set('location', k)} className="w-full text-left flex gap-3 p-3 border-b border-line last:border-0">
            <span className="mt-0.5 w-4 h-4 rounded-full border-2 border-pine grid place-items-center shrink-0">{c.s.location === k && <i className="w-2 h-2 rounded-full bg-pine" />}</span>
            <span><span className="block text-[14px] font-semibold">{t}</span><span className="block text-[12px] text-ink-soft">{d}</span></span></button>))}</div>
      </Section>
      <Section title="Protección ante pulsaciones accidentales">
        <Row title="Mantener 3 s para SOS" desc="Obligatorio. Una pulsación breve nunca lanza un SOS."><span className="mono text-[11px] font-bold border border-pine px-2 py-1">FIJO</span></Row>
        <Row title="Bloqueo con pantalla apagada" desc="Con el reloj dormido, la primera pulsación solo despierta la pantalla."><Toggle label="Bloqueo con pantalla apagada" on={c.s.pocket} onChange={(v) => set('pocket', v)} /></Row>
        <Row title="Vibración de confirmación" desc="El reloj vibra al registrar cada acción."><Toggle label="Vibración" on={c.s.haptic} onChange={(v) => set('haptic', v)} /></Row>
        <Row title="Ventana de doble pulsación" desc="Tiempo máximo entre las dos pulsaciones."><select aria-label="Ventana" value={c.s.window} onChange={(e) => set('window', +e.target.value)} className="mono border border-line bg-paper px-2 py-1.5 text-[13px]">{[300, 450, 600].map((v) => <option key={v} value={v}>{v} ms</option>)}</select></Row>
        <Row title="Cuenta atrás preventiva" desc="Margen para cancelar antes de avisar."><select aria-label="Cuenta atrás" value={c.s.countdown} onChange={(e) => set('countdown', +e.target.value)} className="mono border border-line bg-paper px-2 py-1.5 text-[13px]">{[5, 8, 10].map((v) => <option key={v} value={v}>{v} s</option>)}</select></Row>
      </Section>
      <Section title="Smartwatch · simulación">
        <div className="border border-line bg-paper p-3">
          <div className="flex items-center justify-between"><div><div className="font-semibold text-[14px]">SafeBand S1</div><div className="mono text-[11px] text-ink-soft">ID SB-4F2A-91 · FW 2.3.1</div></div>
            <span className="mono text-[11px] font-bold" style={{ color: c.s.paired ? '#2E6F5E' : '#C85A32' }}>{c.searching ? 'BUSCANDO…' : c.s.paired ? 'VINCULADO' : 'SIN VINCULAR'}</span></div>
          <div className="flex gap-2 mt-3">
            {c.s.paired ? <button onClick={c.unpair} className="flex-1 border border-crimson text-crimson font-semibold py-2.5 text-[13px]">Desvincular</button>
              : <button disabled={c.searching} onClick={c.pair} className="flex-1 bg-pine text-stone font-semibold py-2.5 text-[13px] disabled:opacity-60">{c.searching ? 'Buscando reloj…' : 'Vincular reloj'}</button>}
          </div>
        </div>
        <Row title="Enlace Bluetooth" desc="Apágalo para comprobar qué ocurre si el reloj pierde conexión."><Toggle label="Enlace" on={c.s.connected} onChange={(v) => c.s.paired && set('connected', v)} /></Row>
      </Section>
      <Section title="Privacidad">
        <div className="text-[13px] leading-relaxed space-y-2 border-l-2 border-pine pl-3">
          <p><b>Qué se envía.</b> Hora, nivel, batería del celular y, si la regla lo permite, tu posición en ese instante.</p>
          <p><b>A quién.</b> Solo a los contactos que marcaste para ese nivel. Nunca a terceros ni a servicios externos.</p>
          <p><b>Qué no se hace.</b> No hay seguimiento continuo en segundo plano. El historial vive en este dispositivo y puedes borrarlo.</p>
        </div>
      </Section>
    </div>
  )
}

/* ---------- Phone shell ---------- */
export default function Phone({ c }: { c: Ctx }) {
  const tabs: { k: Tab; l: string }[] = [{ k: 'inicio', l: 'Inicio' }, { k: 'contactos', l: 'Contactos' }, { k: 'alertas', l: 'Alertas' }, { k: 'config', l: 'Ajustes' }]
  return (
    <div className="bg-slate rounded-[48px] p-[10px] border border-black shadow-[0_1px_0_#fff3_inset]" style={{ width: 380 }}>
      <div className="relative bg-stone rounded-[38px] overflow-hidden flex flex-col" style={{ height: 760 }}>
        <div className="flex items-center justify-between px-7 pt-3 pb-1 shrink-0 relative">
          <span className="mono text-[12px] font-bold">{fmtTime(Date.now()).slice(0, 5)}</span>
          <span className="absolute left-1/2 -translate-x-1/2 top-2 w-24 h-6 bg-slate rounded-full" />
          <span className="mono text-[11px] font-bold flex items-center gap-1.5"><i className={`w-1.5 h-1.5 rounded-full ${c.s.connected ? 'bg-sage' : 'bg-amber'}`} />5G</span>
        </div>
        {c.toast && (
          <div key={c.toast.text} role="status" className="slidein absolute top-11 inset-x-3 z-30 text-white px-3 py-2.5 flex items-center gap-2.5 border border-black/20" style={{ background: c.toast.kind === 'sos' ? '#B91C1C' : c.toast.kind === 'cancelada' ? '#14171A' : KIND_COLOR[c.toast.kind] }}>
            <Ico n="alertas" size={18} /><div className="text-[12px] leading-tight"><b>{c.toast.text}</b></div></div>)}
        <div className="flex-1 overflow-y-auto" key={c.tab}>
          {c.tab === 'inicio' && <Inicio c={c} />}{c.tab === 'contactos' && <Contactos c={c} />}{c.tab === 'alertas' && <Alertas c={c} />}{c.tab === 'config' && <Config c={c} />}
        </div>
        <nav className="grid grid-cols-4 border-t border-pine bg-paper shrink-0 pb-3">
          {tabs.map((t) => (
            <button key={t.k} onClick={() => { c.setTab(t.k); if (t.k === 'alertas') c.setDetailId(null) }} aria-current={c.tab === t.k} className={`relative py-2.5 flex flex-col items-center gap-0.5 text-[11px] font-semibold ${c.tab === t.k ? 'text-pine' : 'text-ink-soft'}`}>
              {c.tab === t.k && <span className="absolute top-0 inset-x-4 h-[3px] bg-pine" />}
              <span className="relative"><Ico n={t.k} />{t.k === 'alertas' && c.unread > 0 && <span className="mono absolute -top-1.5 -right-2.5 bg-crimson text-white text-[9px] min-w-4 h-4 px-1 grid place-items-center font-bold">{c.unread}</span>}</span>{t.l}</button>))}
        </nav>
      </div>
    </div>
  )
}
