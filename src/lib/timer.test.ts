import { describe, expect, it } from 'vitest'
import {
  addSession, cycleProgress, DEFAULTS, dayKey, formatMinutes, formatTime, lastDays, nextPhase, phaseSeconds, sanitize, type Phase,
} from './timer'

describe('timer', () => {
  it('formata o tempo', () => {
    expect(formatTime(1500)).toBe('25:00')
    expect(formatTime(59)).toBe('00:59')
    expect(formatTime(59.2)).toBe('01:00')
    expect(formatTime(-5)).toBe('00:00')
  })

  it('segundos de cada fase', () => {
    expect(phaseSeconds('focus', DEFAULTS)).toBe(1500)
    expect(phaseSeconds('short', DEFAULTS)).toBe(300)
    expect(phaseSeconds('long', DEFAULTS)).toBe(900)
  })

  it('ciclo: 3 pausas curtas e a 4ª pausa é longa', () => {
    let phase: Phase = 'focus'
    let completed = 0
    const seen: Phase[] = []
    for (let i = 0; i < 8; i++) {
      const n = nextPhase(phase, completed, DEFAULTS)
      phase = n.phase
      completed = n.completed
      seen.push(phase)
    }
    expect(seen).toEqual(['short', 'focus', 'short', 'focus', 'short', 'focus', 'long', 'focus'])
    expect(completed).toBe(4)
  })

  it('progresso do ciclo', () => {
    expect(cycleProgress('short', 2, DEFAULTS)).toBe(2)
    expect(cycleProgress('long', 4, DEFAULTS)).toBe(4)
    expect(cycleProgress('focus', 4, DEFAULTS)).toBe(0)
  })

  it('sanitiza configurações', () => {
    expect(sanitize({ focus: 0, short: 999, long: NaN, every: 1 })).toEqual({ focus: 1, short: 60, long: 1, every: 2 })
    expect(sanitize({})).toEqual(DEFAULTS)
  })

  it('registra sessões por dia e não muta o log original', () => {
    const d = new Date(2026, 9, 26, 10)
    const a = addSession({}, d, 25)
    const b = addSession(a, d, 25)
    expect(a['2026-10-26']).toBe(25)
    expect(b['2026-10-26']).toBe(50)
  })

  it('últimos dias incluem zeros e marcam hoje', () => {
    const today = new Date(2026, 9, 26)
    const days = lastDays({ '2026-10-26': 50, '2026-10-24': 25 }, 7, today)
    expect(days).toHaveLength(7)
    expect(days[6]).toMatchObject({ key: '2026-10-26', minutes: 50, today: true })
    expect(days[4]).toMatchObject({ key: '2026-10-24', minutes: 25, today: false })
    expect(days[0].key).toBe('2026-10-20')
    expect(days[5].minutes).toBe(0)
  })

  it('dayKey usa o fuso local, com zeros à esquerda', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('formata minutos', () => {
    expect(formatMinutes(25)).toBe('25min')
    expect(formatMinutes(60)).toBe('1h')
    expect(formatMinutes(125)).toBe('2h05')
  })
})
