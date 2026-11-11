document.addEventListener('DOMContentLoaded', () => {
  // ---- Scroll reveal -------------------------------------------------------
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
})
