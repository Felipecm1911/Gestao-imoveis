export type Theme = 'light' | 'dark'

const KEY = 'imobly-theme'

export function currentTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* armazenamento bloqueado: segue o sistema */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme, persist = false) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  if (persist) {
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* sem persistência, só nesta aba */
    }
  }
}
