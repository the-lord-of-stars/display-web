document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -80px 0px'
    }
  )

  document.querySelectorAll('.scroll-reveal').forEach((el) => {
    observer.observe(el)
  })

  const homeCanvas = document.getElementById('home-ai-canvas')

  if (!(homeCanvas instanceof HTMLCanvasElement)) {
    return
  }

  const homeCtx = homeCanvas.getContext('2d')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!homeCtx || reduceMotion) {
    return
  }

  let width = 0
  let height = 0
  let dpr = 1
  let nodes = []
  let rafId = 0

  const pointer = {
    x: -9999,
    y: -9999
  }

  function resizeHomeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)

    width = window.innerWidth
    height = window.innerHeight

    homeCanvas.width = Math.floor(width * dpr)
    homeCanvas.height = Math.floor(height * dpr)
    homeCanvas.style.width = width + 'px'
    homeCanvas.style.height = height + 'px'

    homeCtx.setTransform(dpr, 0, 0, dpr, 0, 0)

    nodes = []

    const count = width < 768 ? 22 : 66

    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 2.1 + 0.9
      })
    }
  }

  function drawHomeCanvas() {
    homeCtx.clearRect(0, 0, width, height)

    const bg = homeCtx.createRadialGradient(
      width * 0.5,
      height * 0.2,
      0,
      width * 0.5,
      height * 0.2,
      Math.max(width, height) * 0.82
    )

    bg.addColorStop(0, 'rgba(20, 184, 166, 0.12)')
    bg.addColorStop(0.45, 'rgba(138, 163, 178, 0.06)')
    bg.addColorStop(1, 'rgba(138, 163, 178, 0)')

    homeCtx.fillStyle = bg
    homeCtx.fillRect(0, 0, width, height)

    for (const node of nodes) {
      node.x += node.vx
      node.y += node.vy

      if (node.x < -20) node.x = width + 20
      if (node.x > width + 20) node.x = -20
      if (node.y < -20) node.y = height + 20
      if (node.y > height + 20) node.y = -20

      const dx = pointer.x - node.x
      const dy = pointer.y - node.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 160) {
        node.x -= dx * 0.0016
        node.y -= dy * 0.0016
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]

        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const maxDist = width < 768 ? 80 : 120

        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.2

          homeCtx.beginPath()
          homeCtx.moveTo(a.x, a.y)
          homeCtx.lineTo(b.x, b.y)
          homeCtx.strokeStyle = `rgba(20, 184, 166, ${opacity})`
          homeCtx.lineWidth = 1
          homeCtx.stroke()
        }
      }
    }

    for (const node of nodes) {
      homeCtx.beginPath()
      homeCtx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
      homeCtx.fillStyle = 'rgba(20, 184, 166, 0.52)'
      homeCtx.fill()
    }

    rafId = window.requestAnimationFrame(drawHomeCanvas)
  }

  function handlePointerMove(event) {
    pointer.x = event.clientX
    pointer.y = event.clientY
  }

  function handlePointerLeave() {
    pointer.x = -9999
    pointer.y = -9999
  }

  resizeHomeCanvas()
  drawHomeCanvas()

  window.addEventListener('resize', resizeHomeCanvas)
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerleave', handlePointerLeave)

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(rafId)
    } else {
      drawHomeCanvas()
    }
  })
})