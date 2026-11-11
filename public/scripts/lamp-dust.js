document.addEventListener('DOMContentLoaded', () => {
  // ---- Lamplight dust ------------------------------------------------------
  // Square "pixel" motes drifting upward through the warm light of a desk lamp.
  // The lamp sits behind the element named by data-lamp (the avatar on the
  // homepage) or at the top centre of the page; motes glow brighter near it.
  const canvas = document.getElementById('lamp-dust')
  if (!(canvas instanceof HTMLCanvasElement)) return

  const ctx = canvas.getContext('2d')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!ctx || reduceMotion) return

  const lampSelector = canvas.dataset.lamp
  const lampEl = lampSelector ? document.querySelector(lampSelector) : null
  // Without a lamp element (inner pages) the light is a little softer
  const lampStrength = lampEl ? 1 : 0.75
  const root = document.documentElement

  let width = 0
  let height = 0
  let dpr = 1
  let motes = []
  let rafId = 0
  let running = false

  // Lamp brightness, 0..1. Theme switches "turn the lamp" off or on:
  // to dark it snaps off and the night glow fades back in slowly,
  // to light it flickers on like a real bulb.
  let lampLevel = 1
  let lampTarget = 1
  let flickerUntil = 0
  new MutationObserver(() => {
    const nowDark = root.classList.contains('dark')
    if (nowDark === lastDark) return
    lastDark = nowDark
    if (nowDark) {
      lampLevel = 0
      flickerUntil = 0
    } else {
      lampLevel = 0.15
      flickerUntil = performance.now() + 420
    }
    lampTarget = 1
  }).observe(root, { attributes: true, attributeFilter: ['class'] })
  let lastDark = root.classList.contains('dark')
  let lampDocX = 0
  let lampDocY = 0
  // Areas holding text, in document coordinates. Motes fade out inside them
  // so the dust never sits on top of words.
  let textRects = []
  const TEXT_PAD = 10
  const TEXT_SELECTOR = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'li',
    'a',
    'button',
    'label',
    'time',
    'pre',
    'table',
    'blockquote',
    'figure',
    'img',
    'input',
    'dt',
    'dd',
    'header',
    'footer',
    'aside',
    '.hero-status-stack',
    '.hero-labels',
    '.skill-slots',
    '.not-prose'
  ].join(',')

  const pointer = { x: -9999, y: -9999 }

  // Late at night the lamp burns a little warmer and the dust drifts slower.
  const hour = new Date().getHours()
  const isNight = hour >= 22 || hour < 6
  const speedScale = isNight ? 0.7 : 1

  const rand = (min, max) => min + Math.random() * (max - min)

  function spawnMote(atBottom) {
    return {
      x: rand(0, width),
      y: atBottom ? height + rand(4, 40) : rand(0, height),
      vx: 0,
      vy: 0,
      rise: rand(0.08, 0.26) * speedScale,
      size: Math.random() < 0.15 ? 4 : Math.random() < 0.45 ? 3 : 2,
      phase: rand(0, Math.PI * 2),
      sway: rand(0.15, 0.45),
      twinkle: rand(0.6, 1.6),
      vis: 0
    }
  }

  function measureLayout() {
    const sy = window.scrollY

    if (lampEl) {
      const rect = lampEl.getBoundingClientRect()
      lampDocX = rect.left + rect.width / 2
      lampDocY = rect.top + rect.height / 2 + sy
    } else {
      lampDocX = width / 2
      lampDocY = 120
    }

    textRects = []
    document.querySelectorAll(TEXT_SELECTOR).forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) return
      textRects.push({
        l: r.left - TEXT_PAD,
        r: r.right + TEXT_PAD,
        t: r.top + sy - TEXT_PAD,
        b: r.bottom + sy + TEXT_PAD
      })
    })
  }

  function overText(x, docY) {
    for (let i = 0; i < textRects.length; i++) {
      const r = textRects[i]
      if (x >= r.l && x <= r.r && docY >= r.t && docY <= r.b) return true
    }
    return false
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = window.innerWidth
    height = window.innerHeight

    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const count = width < 768 ? 34 : 90
    motes = Array.from({ length: count }, () => spawnMote(false))
    measureLayout()
  }

  function draw(time) {
    const t = time / 1000
    const dark = root.classList.contains('dark')

    // Ease the lamp toward full brightness (slower when fading in at night)
    let level
    if (time < flickerUntil) {
      // Stepped flicker while the bulb catches
      level = Math.floor(time / 70) % 2 ? 0.85 : 0.25
      lampLevel = level
    } else {
      lampLevel += (lampTarget - lampLevel) * (dark ? 0.025 : 0.08)
      level = lampLevel
    }
    ctx.clearRect(0, 0, width, height)

    // Lamp position in the viewport (it scrolls away with the hero).
    const lampX = lampDocX
    const lampY = lampDocY - window.scrollY
    const lampR = Math.max(380, Math.min(width, 900) * 0.55)

    // Soft lamp glow
    const glow = ctx.createRadialGradient(lampX, lampY, 0, lampX, lampY, lampR)
    const glowA = (dark ? 0.1 : 0.12) * (isNight ? 1.25 : 1) * lampStrength * level
    const glowRGB = isNight ? '214, 146, 70' : '206, 160, 88'
    glow.addColorStop(0, `rgba(${glowRGB}, ${glowA})`)
    glow.addColorStop(0.5, `rgba(${glowRGB}, ${glowA * 0.35})`)
    glow.addColorStop(1, `rgba(${glowRGB}, 0)`)
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, width, height)

    const moteRGB = dark ? '246, 212, 140' : '150, 98, 40'
    const scrollY = window.scrollY

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i]

      // Gentle push away from the cursor, then ease back to the drift
      const dx = m.x - pointer.x
      const dy = m.y - pointer.y
      const d2 = dx * dx + dy * dy
      if (d2 < 120 * 120 && d2 > 0.01) {
        const d = Math.sqrt(d2)
        const f = (1 - d / 120) * 0.35
        m.vx += (dx / d) * f
        m.vy += (dy / d) * f
      }
      m.vx *= 0.92
      m.vy *= 0.92

      m.x += m.vx + Math.sin(t * m.sway + m.phase) * 0.12
      m.y += m.vy - m.rise

      if (m.y < -10 || m.x < -20 || m.x > width + 20) {
        motes[i] = spawnMote(true)
        continue
      }

      // Fade out smoothly while drifting over text, back in once clear of it
      const target = overText(m.x + m.size / 2, m.y + m.size / 2 + scrollY) ? 0 : 1
      m.vis += (target - m.vis) * 0.12
      if (m.vis < 0.02) continue

      // Brighter inside the lamp light, faint outside it
      const lx = m.x - lampX
      const ly = m.y - lampY
      const lampFalloff = Math.max(0, 1 - Math.sqrt(lx * lx + ly * ly) / lampR)
      const flicker = 0.75 + 0.25 * Math.sin(t * m.twinkle + m.phase)
      // Cream background needs a bit more ink than the dark one to read
      const alpha =
        Math.min(1, ((dark ? 0.32 : 0.46) + lampFalloff * 0.55 * level) * flicker) *
        m.vis *
        (0.35 + 0.65 * level)

      // Snap to whole pixels so each mote reads as a crisp square
      const px = Math.round(m.x)
      const py = Math.round(m.y)

      // Bigger motes get a soft square halo, like light catching the dust
      if (m.size >= 3) {
        ctx.fillStyle = `rgba(${moteRGB}, ${(alpha * 0.18).toFixed(3)})`
        ctx.fillRect(px - 2, py - 2, m.size + 4, m.size + 4)
      }

      ctx.fillStyle = `rgba(${moteRGB}, ${alpha.toFixed(3)})`
      ctx.fillRect(px, py, m.size, m.size)
    }

    rafId = window.requestAnimationFrame(draw)
  }

  function start() {
    if (running) return
    running = true
    rafId = window.requestAnimationFrame(draw)
  }

  function stop() {
    running = false
    window.cancelAnimationFrame(rafId)
  }

  resize()
  start()

  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
  })
  document.addEventListener('pointerleave', () => {
    pointer.x = -9999
    pointer.y = -9999
  })
  // Layout settles as fonts load and sections animate in; measure again then,
  // and whenever the page height changes (e.g. images loading).
  window.addEventListener('load', measureLayout)
  document.fonts?.ready.then(measureLayout)
  setTimeout(measureLayout, 1200)
  setTimeout(measureLayout, 3000)
  // Sticky elements such as the table of contents move while scrolling,
  // so re-measure during scroll (at most every ~120ms)
  let scrollMeasureAt = 0
  let scrollMeasureTimer = 0
  window.addEventListener(
    'scroll',
    () => {
      const now = performance.now()
      clearTimeout(scrollMeasureTimer)
      if (now - scrollMeasureAt > 120) {
        scrollMeasureAt = now
        measureLayout()
      }
      scrollMeasureTimer = setTimeout(measureLayout, 140)
    },
    { passive: true }
  )

  // Scroll-reveal sections slide 16px into place; re-measure once they land
  let remeasureTimer = 0
  document.addEventListener('transitionend', (e) => {
    if (!(e.target instanceof Element) || !e.target.classList.contains('scroll-reveal')) return
    clearTimeout(remeasureTimer)
    remeasureTimer = setTimeout(measureLayout, 50)
  })
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => measureLayout()).observe(document.body)
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop()
    else start()
  })
})
