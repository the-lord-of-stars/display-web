// Pixel dissolve between pages.
// Leaving: the page is covered by background-coloured blocks in random order, then we navigate.
// Arriving: <head> marks the page as `px-entering` (a full cover painted before first paint);
// here we swap that cover for the same block grid and uncover it block by block.
;(() => {
  const root = document.documentElement
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const FLAG = 'px-nav'
  const EXIT_MS = 260
  const ENTER_MS = 360

  const cellSize = () => (window.innerWidth < 640 ? 18 : 26)

  function makeOverlay() {
    const canvas = document.createElement('canvas')
    canvas.className = 'px-transition'
    canvas.setAttribute('aria-hidden', 'true')
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    const size = cellSize()
    const cols = Math.ceil(w / size)
    const rows = Math.ceil(h / size)
    // Random order of every cell
    const order = Array.from({ length: cols * rows }, (_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#FBF9F4'
    return { canvas, ctx, size, cols, order }
  }

  function cellRect(o, index) {
    const x = (index % o.cols) * o.size
    const y = Math.floor(index / o.cols) * o.size
    return [x, y, o.size, o.size]
  }

  // Run `step(done)` for each newly reached cell over `duration` ms
  function sweep(o, duration, step, onEnd) {
    const start = performance.now()
    let done = 0
    const frame = (now) => {
      const target = Math.min(o.order.length, Math.ceil(((now - start) / duration) * o.order.length))
      for (; done < target; done++) step(cellRect(o, o.order[done]))
      if (done < o.order.length) requestAnimationFrame(frame)
      else onEnd()
    }
    requestAnimationFrame(frame)
  }

  // ---- Arrive ---------------------------------------------------------------
  function enter() {
    sessionStorage.removeItem(FLAG)
    if (!root.classList.contains('px-entering')) return
    const o = makeOverlay()
    o.ctx.fillRect(0, 0, o.canvas.width, o.canvas.height)
    document.body.appendChild(o.canvas)
    root.classList.remove('px-entering')
    // Never leave the page covered, even if animation frames are paused (hidden tab)
    const failsafe = setTimeout(() => o.canvas.remove(), ENTER_MS + 600)
    sweep(
      o,
      ENTER_MS,
      (r) => o.ctx.clearRect(...r),
      () => {
        clearTimeout(failsafe)
        o.canvas.remove()
      }
    )
  }

  if (document.body) enter()
  else document.addEventListener('DOMContentLoaded', enter, { once: true })

  // Coming back via the back/forward cache: make sure nothing is left covering the page
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return
    root.classList.remove('px-entering')
    document.querySelectorAll('.px-transition').forEach((el) => el.remove())
  })

  // ---- Leave ----------------------------------------------------------------
  if (reduceMotion) return

  let leaving = false
  window.addEventListener('pageshow', () => {
    leaving = false
  })
  document.addEventListener('click', (e) => {
    if (leaving || e.defaultPrevented || e.button !== 0) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const link = e.target instanceof Element ? e.target.closest('a[href]') : null
    if (!link || link.hasAttribute('download') || link.dataset.noTransition !== undefined) return
    if (link.target && link.target !== '_self') return

    const url = new URL(link.href, location.href)
    if (url.origin !== location.origin) return
    // Same page (only the hash differs): let the browser scroll normally
    if (url.pathname === location.pathname && url.search === location.search) return

    e.preventDefault()
    leaving = true
    sessionStorage.setItem(FLAG, '1')

    const o = makeOverlay()
    document.body.appendChild(o.canvas)
    const go = () => location.assign(url.href)
    // Fallback in case animation frames are throttled (background tab etc.)
    const fallback = setTimeout(go, EXIT_MS + 300)
    sweep(
      o,
      EXIT_MS,
      (r) => o.ctx.fillRect(...r),
      () => {
        clearTimeout(fallback)
        go()
      }
    )
  })
})()
