export type Phase = 'focus' | 'short' | 'long'

export interface Settings {
  /** durações em minutos */
  focus: number
  short: number
  long: number
  /** quantos focos até a pausa longa */
  every: number
}

export const DEFAULTS: Settings = { focus: 25, short: 5, long: 15, every: 4 }

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(Number.isFinite(n) ? n : min)))

export function sanitize(s: Partial<Settings>): Settings {
  return {
    focus: clamp(s.focus ?? DEFAULTS.focus, 1, 120),
    short: clamp(s.short ?? DEFAULTS.short, 1, 60),
    long: clamp(s.long ?? DEFAULTS.long, 1, 90),
    every: clamp(s.every ?? DEFAULTS.every, 2, 8),
  }
}

export function phaseSeconds(phase: Phase, s: Settings): number {
  return s[phase === 'focus' ? 'focus' : phase] * 60
}

/** Próxima fase ao terminar a atual. `completed` conta focos concluídos. */
export function nextPhase(current: Phase, completed: number, s: Settings): { phase: Phase; completed: number } {
  if (current !== 'focus') return { phase: 'focus', completed }
  const done = completed + 1
  return { phase: done % s.every === 0 ? 'long' : 'short', completed: done }
}

export function formatTime(totalSeconds: number): string {
  const t = Math.max(0, Math.ceil(totalSeconds))
  const m = Math.floor(t / 60)
  const s = t % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Bolinhas preenchidas do ciclo atual. */
export function cycleProgress(phase: Phase, completed: number, s: Settings): number {
  if (phase === 'long') return s.every
  return completed % s.every
}

/* ---------- estatísticas ---------- */

export type Log = Record<string, number>

/** Chave YYYY-MM-DD no fuso local. */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function addSession(log: Log, date: Date, minutes: number): Log {
  const k = dayKey(date)
  return { ...log, [k]: (log[k] ?? 0) + minutes }
}

export interface Day {
  key: string
  weekday: string
  minutes: number
  today: boolean
}

export function lastDays(log: Log, n: number, today: Date): Day[] {
  const out: Day[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const key = dayKey(d)
    out.push({
      key,
      weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      minutes: log[key] ?? 0,
      today: i === 0,
    })
  }
  return out
}

export function formatMinutes(m: number): string {
  const h = Math.floor(m / 60)
  const r = m % 60
  return h ? `${h}h${r ? String(r).padStart(2, '0') : ''}` : `${r}min`
}
