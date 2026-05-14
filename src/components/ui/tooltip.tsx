"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <div className="relative group">{children}</div>
}

export function TooltipTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  return <div className="cursor-help">{children}</div>
}

export function TooltipContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn(
      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-xl shadow-xl border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 min-w-[150px] text-center",
      className
    )}>
      {children}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-popover" />
    </div>
  )
}
