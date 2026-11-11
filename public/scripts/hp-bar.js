// Segmented "EXP" reading progress for blog posts (see .hp-bar in global.css)
(() => {
  const fill = document.querySelector('.hp-bar-fill')
  const bar = document.querySelector('.hp-bar')
  const SEGMENTS = 24
  let ticking = false
  const update = () => {
    ticking = false
    const article = document.getElementById('content')
    if (!fill) return
    // Same rule as the back-to-top percentage: progress through the article,
    // or through the whole page when the article is shorter than half a screen
    const viewport = window.innerHeight
    let raw = 1
    const rect = article ? article.getBoundingClientRect() : null
    const range = rect ? rect.height - viewport : 0
    if (rect && rect.height > viewport * 0.5 && range > 0) {
      raw = (window.scrollY - (rect.top + window.scrollY)) / range
    } else {
      const pageRange = document.documentElement.scrollHeight - viewport
      raw = pageRange > 0 ? window.scrollY / pageRange : 1
    }
    const p = Math.min(1, Math.max(0, raw))
    // Fill whole segments only, like an 8-bit gauge
    const filled = Math.ceil(p * SEGMENTS) / SEGMENTS
    fill.style.transform = `scaleX(${filled})`
    bar.classList.toggle('is-visible', window.scrollY > 80)
    const full = p >= 0.999
    bar.classList.toggle('is-full', full)
    // First time the gauge fills on this page: the post counts as read (quest.js)
    if (full && !finished && window.scrollY > 80) {
      finished = true
      window.dispatchEvent(new CustomEvent('px:event', { detail: { type: 'read' } }))
    }
  }
  let finished = false
  const onScroll = () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(update)
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  document.addEventListener('DOMContentLoaded', update)
})()
