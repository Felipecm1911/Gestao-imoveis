import { useSyncExternalStore } from 'react'

/** Renderiza só uma das versões (tabela ou cards) em vez de esconder com CSS. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', notify)
      return () => mql.removeEventListener('change', notify)
    },
    () => window.matchMedia(query).matches,
  )
}
