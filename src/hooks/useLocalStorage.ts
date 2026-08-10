"use client"

import { useState, useCallback } from "react"

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key)
      if (saved !== null) return JSON.parse(saved) as T
    } catch {}
    return defaultValue
  })

  const setAndSave = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next
        try { localStorage.setItem(key, JSON.stringify(resolved)) } catch {}
        return resolved
      })
    },
    [key],
  )

  return [value, setAndSave]
}