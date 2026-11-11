// Segmented "EXP" reading progress for blog posts (see .hp-bar in global.css)
(() => {
  const fill = document.querySelector('.hp-bar-fill')
  const bar = document.querySelector('.hp-bar')
  const SEGMENTS = 24
  let ticking = false
  const update = () => {
    ticking = false
    const article = document.getElementById('content')
    if (!article || !fill) return
    const start = article.offsetTop
    const end = start + article.offsetHeight - window.innerHeight
    const raw = (window.scrollY - start) / Math.max(1, end - start)
    const p = Math.min(1, Math.max(0, raw))
    // Fill whole segments only, like an 8-bit gauge
    const filled = Math.ceil(p * SEGMENTS) / SEGMENTS
    fill.style.transform = `scaleX(${filled})`
    bar.classList.toggle('is-visible', window.scrollY > 80)
    bar.classList.toggle('is-full', p >= 0.999)
  }
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
