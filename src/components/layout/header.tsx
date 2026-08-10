"use client"

import Link from "next/link"
import { FolderOpen, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { EngineStats } from "reze-engine"

export function Header({
    stats,
    engineInited,
    onOpenFolder,
  }: {
  stats: EngineStats | null
  engineInited: boolean
  onOpenFolder: () => void
}) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex h-12 items-center justify-between gap-3 px-4">
      <div className="hidden items-baseline gap-2 md:flex">
        <span className="text-sm font-semibold tracking-tight text-white">MiKaPo</span>
        <span className="hidden text-xs text-white/50 lg:inline">Real-time MMD motion capture</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden items-center gap-1.5 md:flex">
          {stats && (
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] tabular-nums text-white/70">
              {stats.fps} FPS
            </span>
          )}

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild className="h-8 px-2.5 text-xs font-normal text-white/70 hover:bg-white/10 hover:text-white">
              <Link href="https://reze.one" target="_blank">Engine</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="h-8 px-2.5 text-xs font-normal text-white/70 hover:bg-white/10 hover:text-white">
              <Link href="https://reze.studio" target="_blank">Animation</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="h-8 px-2.5 text-xs font-normal text-white/70 hover:bg-white/10 hover:text-white">
              <Link href="https://reze.design" target="_blank">Design</Link>
            </Button>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!engineInited}
            className="h-8 gap-1 border border-white/10 bg-white/10 px-2 text-xs font-normal text-white hover:bg-white/15 disabled:opacity-50 has-[>svg]:px-2"
            onClick={onOpenFolder}
          >
            <FolderOpen className="size-3.5" />
            Use Your Model
          </Button>
        </div>

        <span className="text-sm font-semibold tracking-tight text-white md:hidden">MiKaPo</span>

        <Button variant="ghost" size="icon" asChild className="size-8 text-white/70 hover:bg-white/10 hover:text-white">
          <Link href="https://github.com/AmyangXYZ/MiKaPo" target="_blank" aria-label="GitHub">
            <Github className="size-4" />
          </Link>
        </Button>
      </div>
    </header>
  )
}