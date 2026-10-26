import '@fontsource-variable/instrument-sans'
import './styles/base.css'
import './styles/app.css'
import {
  addSession, cycleProgress, DEFAULTS, formatMinutes, formatTime, lastDays, nextPhase, phaseSeconds, sanitize,
  type Log, type Phase, type Settings,
} from './lib/timer'
import { initMotion } from './motion'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const KEY_SETTINGS = 'focus-timer:settings'
const KEY_LOG = 'focus-timer:log'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* armazenamento indisponível: o app segue funcionando sem persistir */
  }
}

let settings: Settings = sanitize(load<Partial<Settings>>(KEY_SETTINGS, DEFAULTS))
let log: Log = load<Log>(KEY_LOG, {})

const state = {
  phase: 'focus' as Phase,
  completed: 0,
  running: false,
  endsAt: 0,
  remainingMs: phaseSeconds('focus', settings) * 1000,
}

const LABEL: Record<Phase, string> = { focus: 'Foco', short: 'Pausa curta', long: 'Pausa longa' }
const R = 148
const C = 2 * Math.PI * R
$('progress').style.setProperty('--c', String(C))

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
  } catch {
    /* sem áudio: segue sem aviso sonoro */
  }
}

function remaining() {
  return state.running ? Math.max(0, state.endsAt - Date.now()) : state.remainingMs
}

function render() {
  const total = phaseSeconds(state.phase, settings) * 1000
  const left = remaining()
  const t = formatTime(left / 1000)
  $('time').textContent = t
  $('phase').textContent = LABEL[state.phase]
  $('progress').style.setProperty('--o', String(C * (1 - left / total)))
  document.body.dataset.phase = state.phase
  document.title = `${t} · ${LABEL[state.phase]}`
  $('toggle').textContent = state.running ? 'Pausar' : left < total ? 'Continuar' : 'Iniciar'

  const filled = cycleProgress(state.phase, state.completed, settings)
  $('dots').innerHTML = Array.from({ length: settings.every }, (_, i) => `<li class="${i < filled ? 'on' : ''}"></li>`).join('')
}

function setPhase(phase: Phase, completed = state.completed, autostart = false) {
  state.phase = phase
  state.completed = completed
  state.remainingMs = phaseSeconds(phase, settings) * 1000
  state.running = autostart
  if (autostart) state.endsAt = Date.now() + state.remainingMs
  render()
}

function finish() {
  if (state.phase === 'focus') {
    log = addSession(log, new Date(), settings.focus)
    save(KEY_LOG, log)
    renderStats()
  }
  beep()
  const n = nextPhase(state.phase, state.completed, settings)
  setPhase(n.phase, n.completed)
}

function toggle() {
  if (state.running) {
    state.remainingMs = remaining()
    state.running = false
  } else {
    state.endsAt = Date.now() + state.remainingMs
    state.running = true
  }
  render()
}

function renderStats() {
  const days = lastDays(log, 7, new Date())
  const max = Math.max(...days.map((d) => d.minutes), 1)
  const total = days.reduce((s, d) => s + d.minutes, 0)
  const today = days[6].minutes
  const sessions = Math.round(total / settings.focus)
  $('totals').innerHTML = [
    ['Hoje', formatMinutes(today)],
    ['7 dias', formatMinutes(total)],
    ['Sessões (aprox.)', String(sessions)],
  ]
    .map(([k, v]) => `<li><span>${k}</span><strong>${v}</strong></li>`)
    .join('')
  $('bars').innerHTML = days
    .map(
      (d) =>
        `<li class="${d.today ? 'today' : ''}"><div class="col" style="--h:${Math.max(2, (d.minutes / max) * 100).toFixed(0)}" role="img" aria-label="${d.weekday}: ${d.minutes} minutos"></div><b>${d.minutes ? formatMinutes(d.minutes) : '–'}</b><small>${d.weekday}</small></li>`,
    )
    .join('')
}

$('toggle').addEventListener('click', toggle)
$('reset').addEventListener('click', () => setPhase(state.phase))
$('skip').addEventListener('click', () => {
  const n = nextPhase(state.phase, state.completed, settings)
  setPhase(n.phase, n.completed)
})
$('clear').addEventListener('click', () => {
  if (!confirm('Apagar todo o histórico de foco?')) return
  log = {}
  save(KEY_LOG, log)
  renderStats()
})

const fields: [keyof Settings, string][] = [['focus', 's-focus'], ['short', 's-short'], ['long', 's-long'], ['every', 's-every']]
fields.forEach(([k, id]) => {
  const el = $<HTMLInputElement>(id)
  el.value = String(settings[k])
  el.addEventListener('change', () => {
    settings = sanitize({ ...settings, [k]: parseFloat(el.value) })
    el.value = String(settings[k])
    save(KEY_SETTINGS, settings)
    if (!state.running) setPhase(state.phase)
    else render()
  })
})

addEventListener('keydown', (e) => {
  const tag = (e.target as HTMLElement).tagName
  if (e.code !== 'Space' || ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(tag)) return
  e.preventDefault()
  toggle()
})

setInterval(() => {
  if (!state.running) return
  if (remaining() <= 0) finish()
  else render()
}, 200)

state.remainingMs = phaseSeconds('focus', settings) * 1000
render()
renderStats()
initMotion()
