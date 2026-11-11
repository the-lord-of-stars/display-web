// Reader quest: EXP, levels and achievements kept in this browser (localStorage),
// plus Tia (the Live2D girl) reacting to what happens on the site.
// Events come in as `px:event` with detail.type: 'read' (hp-bar.js), 'avatar' (home page).
;(() => {
  const KEY = 'px-quest'
  const SECTIONS = ['home', 'blog', 'projects', 'about', 'publications']
  const EXP_PER_LEVEL = 60
  const ACHIEVEMENTS = {
    explorer: ['Explorer', 'Visited every room on the site'],
    bookworm: ['Bookworm', 'Read a post to the very end'],
    scholar: ['Scholar', 'Finished three posts'],
    lamplighter: ['Lamplighter', 'Switched the desk lamp'],
    hello: ['Hello There', 'Said hi to the girl at the desk'],
    lost: ['Off the Map', 'Found a page that does not exist'],
    owl: ['Night Owl', 'Dropped by after midnight']
  }
  const TITLES = [
    [9, 'Librarian'],
    [6, 'Scholar'],
    [4, 'Regular'],
    [2, 'Reader'],
    [1, 'Visitor']
  ]

  // ---- state ---------------------------------------------------------------
  const load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || '{}')
      return {
        xp: Number(s.xp) || 0,
        read: Array.isArray(s.read) ? s.read : [],
        seen: Array.isArray(s.seen) ? s.seen : [],
        ach: Array.isArray(s.ach) ? s.ach : []
      }
    } catch (e) {
      return { xp: 0, read: [], seen: [], ach: [] }
    }
  }
  const state = load()
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch (e) {}
  }
  const level = (xp = state.xp) => Math.floor(xp / EXP_PER_LEVEL) + 1
  const title = (lv) => TITLES.find(([min]) => lv >= min)[1]

  // ---- output: toasts (queued so they don't overwrite each other) and Tia ----
  const toasts = []
  let toastBusy = false
  const toast = (message) => {
    toasts.push(message)
    if (!toastBusy) nextToast()
  }
  const nextToast = () => {
    const message = toasts.shift()
    if (!message) return (toastBusy = false)
    toastBusy = true
    document.dispatchEvent(new CustomEvent('toast', { detail: { message } }))
    setTimeout(nextToast, 3300)
  }

  let pendingLine = null
  const say = (text, duration = 5000) => {
    const tia = window.__tia
    if (tia && typeof tia.tipsMessage === 'function') tia.tipsMessage(text, duration, 9)
    else pendingLine = [text, duration]
  }
  window.addEventListener('tia:ready', () => {
    if (!pendingLine) return
    // Let her welcome line show first
    const [text, duration] = pendingLine
    pendingLine = null
    setTimeout(() => say(text, duration), 4500)
  })
  const pick = (lines) => lines[Math.floor(Math.random() * lines.length)]

  // ---- progress ------------------------------------------------------------
  const gain = (amount) => {
    const before = level()
    state.xp += amount
    save()
    render()
    const after = level()
    if (after > before) {
      toast(`LEVEL UP! You are now LV ${after} ${title(after)}.`)
      return true
    }
    return false
  }

  const unlock = (id) => {
    if (state.ach.includes(id) || !ACHIEVEMENTS[id]) return false
    state.ach.push(id)
    const [name, desc] = ACHIEVEMENTS[id]
    toast(`★ Achievement unlocked: ${name}. ${desc}.`)
    gain(20)
    return true
  }

  // ---- footer badge: "LV 3 Reader" with a tiny segmented EXP gauge ---------
  const badge = document.querySelector('.quest-badge')
  const render = () => {
    if (!badge) return
    const lv = level()
    const into = state.xp % EXP_PER_LEVEL
    badge.querySelector('.quest-level').textContent = `LV ${lv}`
    badge.querySelector('.quest-title').textContent = title(lv)
    badge.querySelector('.quest-fill').style.transform = `scaleX(${
      Math.floor((into / EXP_PER_LEVEL) * 6) / 6
    })`
    badge.setAttribute(
      'aria-label',
      `Reader level ${lv}, ${title(lv)}. ${state.ach.length} of ${
        Object.keys(ACHIEVEMENTS).length
      } achievements. Show progress`
    )
    badge.hidden = false
  }
  badge?.addEventListener('click', () => {
    const total = Object.keys(ACHIEVEMENTS).length
    const next = EXP_PER_LEVEL - (state.xp % EXP_PER_LEVEL)
    const names = state.ach.map((id) => ACHIEVEMENTS[id][0]).join(', ')
    toasts.length = 0
    toastBusy = false
    toast(
      `${state.ach.length}/${total} achievements${names ? `: ${names}` : ''}. ${next} EXP to the next level.`
    )
  })

  // ---- what happens on this page -------------------------------------------
  const path = location.pathname.replace(/\/+$/, '') || '/'
  const section = path === '/' ? 'home' : path.split('/')[1]
  const isNotFound = !!document.querySelector('.notfound')

  // Run after deferred/module scripts so the toast listener is in place
  const onPage = () => {
    if (SECTIONS.includes(section) && !state.seen.includes(section)) {
      state.seen.push(section)
      gain(5)
      if (SECTIONS.every((s) => state.seen.includes(s)) && unlock('explorer'))
        say("You've seen every room now. Make yourself at home!")
    }
    const hour = new Date().getHours()
    if (hour < 5) unlock('owl')
    if (isNotFound) {
      unlock('lost')
      say(pick(["Hmm... I think we're lost.", 'This page is not on any shelf I know. Back to the desk?']))
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onPage)
  else onPage()

  window.addEventListener('px:event', (e) => {
    const type = e.detail && e.detail.type
    if (type === 'read') {
      if (state.read.includes(path)) return say('Read it again? It must be a good one.', 4000)
      state.read.push(path)
      const leveled = gain(30)
      unlock('bookworm')
      if (state.read.length >= 3) unlock('scholar')
      say(leveled ? `Level up! You're LV ${level()} now. Nice reading!` : 'All done! +30 EXP for you.')
    } else if (type === 'avatar') {
      unlock('hello')
      say(
        pick([
          "H-hey! That's Zefei's portrait... but hi!",
          "Hehe, she's busy typing. I'll pass on your hello.",
          'Hearts and coffee steam! You found the trick.'
        ]),
        4000
      )
    }
  })

  // Theme toggle = switching the desk lamp
  const html = document.documentElement
  let dark = html.classList.contains('dark')
  new MutationObserver(() => {
    const now = html.classList.contains('dark')
    if (now === dark) return
    dark = now
    unlock('lamplighter')
    say(now ? 'Lights out~ Cozy, isn’t it?' : 'Lights on! Much easier to read.', 3500)
  }).observe(html, { attributes: true, attributeFilter: ['class'] })

  save()
  render()
})()
