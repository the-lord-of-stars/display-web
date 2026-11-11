// Images sharpen out of a pixel mosaic as they load: 24px blocks -> 12 -> 6 -> 3 -> the
// real image. Same visual language as the page transition. Images that are already
// cached when the page opens are left alone, so returning visits stay instant.
;(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const SELECTOR = '#content img, .prose img, .pixel-frame img, .post-preview img'
  const SKIP = '.hero-avatar, [data-no-mosaic], header img, footer img'
  const BLOCKS = [24, 12, 6, 3]
  const STEP_MS = 85
  const MIN_SIZE = 64

  const reveal = (img) => img.classList.remove('is-mosaicking')

  // Which part of the image is visible, honouring object-fit (cover/contain/fill)
  const frame = (img, w, h) => {
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const fit = getComputedStyle(img).objectFit
    if (fit === 'cover') {
      const s = Math.max(w / iw, h / ih)
      const sw = w / s
      const sh = h / s
      return { sx: (iw - sw) / 2, sy: (ih - sh) / 2, sw, sh, dx: 0, dy: 0, dw: w, dh: h }
    }
    if (fit === 'contain' || fit === 'scale-down') {
      const s = Math.min(w / iw, h / ih)
      const dw = iw * s
      const dh = ih * s
      return { sx: 0, sy: 0, sw: iw, sh: ih, dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh }
    }
    return { sx: 0, sy: 0, sw: iw, sh: ih, dx: 0, dy: 0, dw: w, dh: h }
  }

  const sharpen = (img) => {
    const w = img.offsetWidth
    const h = img.offsetHeight
    if (w < MIN_SIZE || h < MIN_SIZE || !img.naturalWidth || !img.offsetParent) return reveal(img)

    const canvas = document.createElement('canvas')
    canvas.className = 'mosaic-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    Object.assign(canvas.style, {
      left: `${img.offsetLeft}px`,
      top: `${img.offsetTop}px`,
      width: `${w}px`,
      height: `${h}px`,
      borderRadius: getComputedStyle(img).borderRadius
    })
    const ctx = canvas.getContext('2d')
    if (!ctx) return reveal(img)
    img.insertAdjacentElement('afterend', canvas)

    const f = frame(img, w, h)
    const draw = (block) => {
      canvas.width = Math.max(1, Math.ceil(w / block))
      canvas.height = Math.max(1, Math.ceil(h / block))
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh, f.dx / block, f.dy / block, f.dw / block, f.dh / block)
    }

    let i = 0
    draw(BLOCKS[0])
    const tick = () => {
      i++
      if (i < BLOCKS.length) {
        draw(BLOCKS[i])
        setTimeout(tick, STEP_MS)
      } else {
        reveal(img)
        canvas.remove()
      }
    }
    setTimeout(tick, STEP_MS)
  }

  const watch = (img) => {
    if (img.closest(SKIP) || img.matches(SKIP)) return
    // Already decoded (cache / above-the-fold before this ran): show as is
    if (img.complete && img.naturalWidth) return
    img.classList.add('is-mosaicking')
    img.addEventListener(
      'load',
      () => {
        const go = () => requestAnimationFrame(() => sharpen(img))
        img.decode ? img.decode().then(go, go) : go()
      },
      { once: true }
    )
    img.addEventListener('error', () => reveal(img), { once: true })
  }

  document.querySelectorAll(SELECTOR).forEach(watch)
})()
