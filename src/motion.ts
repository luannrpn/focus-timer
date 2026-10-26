import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

/** Quebra o texto em linhas visuais: .line > span, para revelar linha a linha. */
function splitLines(el: HTMLElement): HTMLElement[] {
  const text = el.dataset.text ?? (el.dataset.text = el.textContent?.trim() ?? '')
  el.setAttribute('aria-label', text)
  el.textContent = ''

  const words = text.split(/\s+/).map((w) => {
    const s = document.createElement('span')
    s.style.display = 'inline-block'
    s.textContent = w
    el.append(s, ' ')
    return s
  })

  const groups: string[][] = []
  let top = -1
  words.forEach((w) => {
    if (w.offsetTop !== top) {
      groups.push([])
      top = w.offsetTop
    }
    groups[groups.length - 1].push(w.textContent ?? '')
  })

  el.textContent = ''
  return groups.map((g) => {
    const line = document.createElement('span')
    line.className = 'line'
    line.setAttribute('aria-hidden', 'true')
    const inner = document.createElement('span')
    inner.textContent = g.join(' ')
    line.append(inner)
    el.append(line)
    return inner
  })
}

function revealTitles() {
  document.querySelectorAll<HTMLElement>('[data-lines]').forEach((el) => {
    ScrollTrigger.getAll().filter((t) => t.trigger === el).forEach((t) => t.kill())
    const lines = splitLines(el)
    if (reduced) return
    gsap.from(lines, {
      yPercent: 110,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    })
  })
}

function revealBlocks() {
  if (reduced) return
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 24,
      duration: 1,
      ease: 'power3.out',
      delay: 0.25,
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    })
  })
}

function magnetic() {
  if (reduced || matchMedia('(pointer: coarse)').matches) return
  document.querySelectorAll<HTMLElement>('.magnetic').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' })
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' })
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      x((e.clientX - (r.left + r.width / 2)) * 0.25)
      y((e.clientY - (r.top + r.height / 2)) * 0.25)
    })
    el.addEventListener('pointerleave', () => {
      x(0)
      y(0)
    })
  })
}

function cursor() {
  const dot = document.querySelector<HTMLElement>('.cursor')
  if (!dot || reduced || matchMedia('(pointer: coarse)').matches) return
  const x = gsap.quickTo(dot, 'x', { duration: 0.25, ease: 'power3' })
  const y = gsap.quickTo(dot, 'y', { duration: 0.25, ease: 'power3' })
  addEventListener('pointermove', (e) => {
    dot.classList.add('on')
    x(e.clientX)
    y(e.clientY)
  })
  document.addEventListener('pointerleave', () => dot.classList.remove('on'))
  document.querySelectorAll('a, button, label, .magnetic').forEach((el) => {
    el.addEventListener('pointerenter', () => dot.classList.add('big'))
    el.addEventListener('pointerleave', () => dot.classList.remove('big'))
  })
}

function smoothScroll() {
  if (reduced) return
  const lenis = new Lenis({ lerp: 0.1 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href') ?? '')
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target as HTMLElement, { offset: -24 })
    }),
  )
}

/** Anima um número até o valor final (respeita reduced-motion). */
const counters = new WeakMap<HTMLElement, { v: number }>()
export function countTo(el: HTMLElement, value: number, format: (n: number) => string) {
  const state = counters.get(el) ?? { v: 0 }
  counters.set(el, state)
  if (reduced) {
    el.textContent = format(value)
    return
  }
  gsap.to(state, {
    v: value,
    duration: 0.9,
    ease: 'power3.out',
    overwrite: true,
    onUpdate: () => (el.textContent = format(state.v)),
  })
}

export function initMotion() {
  smoothScroll()
  revealTitles()
  revealBlocks()
  magnetic()
  cursor()

  let w = innerWidth
  let t: number
  addEventListener('resize', () => {
    clearTimeout(t)
    t = window.setTimeout(() => {
      if (innerWidth === w) return
      w = innerWidth
      revealTitles()
      ScrollTrigger.refresh()
    }, 250)
  })
}
