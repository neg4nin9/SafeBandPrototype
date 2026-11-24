export type Kind = 'checkin' | 'preventiva' | 'cancelada' | 'sos'
export type Contact = { id: string; name: string; rel: string; phone: string; checkin: boolean; preventiva: boolean; sos: boolean }
export type Receipt = { contactId: string; name: string; status: 'enviando' | 'entregado' | 'leído'; at?: number }
export type Alert = { id: string; kind: Kind; ts: number; lat: number; lng: number; battery: number; tier: number; receipts: Receipt[]; note: string; source: 'Reloj' | 'App' }
export type Settings = {
  location: 'alert' | 'checkin'; haptic: boolean; hold: boolean; pocket: boolean; window: number; countdown: number; connected: boolean; paired: boolean
}

export const KIND_LABEL: Record<Kind, string> = { checkin: 'Check-in silencioso', preventiva: 'Alerta preventiva', cancelada: 'Alerta cancelada', sos: 'SOS inmediato' }
export const TIER: Record<Kind, number> = { checkin: 1, preventiva: 2, cancelada: 2, sos: 3 }
export const KIND_COLOR: Record<Kind, string> = { checkin: '#2E6F5E', preventiva: '#C85A32', cancelada: '#6b6f6a', sos: '#B91C1C' }

export const fmtTime = (t: number) => new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
export const fmtDate = (t: number) => new Date(t).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '')
export const fmtCoord = (n: number, pos: string, neg: string) => `${Math.abs(n).toFixed(5)}° ${n >= 0 ? pos : neg}`

const h = (n: number, extraMin = 0) => Date.now() - n * 3600_000 - extraMin * 60_000
const rc = (ids: [string, string][], st: Receipt['status'] = 'leído'): Receipt[] => ids.map(([contactId, name]) => ({ contactId, name, status: st, at: 0 }))

export const SEED_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Marta Ibáñez', rel: 'Pareja', phone: '+34 612 408 331', checkin: true, preventiva: true, sos: true },
  { id: 'c2', name: 'Lucía Ibáñez', rel: 'Familia · Hermana', phone: '+34 655 120 874', checkin: true, preventiva: true, sos: true },
  { id: 'c3', name: 'Andrés Roldán', rel: 'Amistad', phone: '+34 678 903 215', checkin: false, preventiva: true, sos: true },
  { id: 'c4', name: 'Carmen Soler', rel: 'Familia · Madre', phone: '+34 91 553 28 40', checkin: false, preventiva: false, sos: true },
]

export const SEED_ALERTS: Alert[] = [
  { id: 'a1', kind: 'checkin', ts: h(3, 12), lat: 40.41831, lng: -3.70275, battery: 83, tier: 1, source: 'Reloj', note: 'En camino · Sin ubicación', receipts: rc([['c1', 'Marta Ibáñez'], ['c2', 'Lucía Ibáñez']]) },
  { id: 'a2', kind: 'cancelada', ts: h(26), lat: 40.42377, lng: -3.69141, battery: 74, tier: 2, source: 'Reloj', note: 'Cancelada a los 3 s · pulsación accidental en el bolso', receipts: [] },
  { id: 'a3', kind: 'preventiva', ts: h(52, 20), lat: 40.40992, lng: -3.69886, battery: 61, tier: 2, source: 'Reloj', note: 'Cuenta atrás completada · camino poco iluminado', receipts: rc([['c1', 'Marta Ibáñez'], ['c2', 'Lucía Ibáñez'], ['c3', 'Andrés Roldán']]) },
  { id: 'a4', kind: 'checkin', ts: h(74), lat: 40.43012, lng: -3.70411, battery: 90, tier: 1, source: 'Reloj', note: 'En camino · Sin ubicación', receipts: rc([['c1', 'Marta Ibáñez'], ['c2', 'Lucía Ibáñez']]) },
  { id: 'a5', kind: 'sos', ts: h(120), lat: 40.41544, lng: -3.70742, battery: 48, tier: 3, source: 'Reloj', note: 'Simulacro de prueba con contactos', receipts: rc([['c1', 'Marta Ibáñez'], ['c2', 'Lucía Ibáñez'], ['c3', 'Andrés Roldán'], ['c4', 'Carmen Soler']]) },
]
