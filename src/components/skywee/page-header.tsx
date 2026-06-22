"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { type LucideIcon } from "lucide-react"

export interface PageHeaderProps {
  eyebrow: string
  title: string
  titleAccent?: string
  description: string
  icon?: LucideIcon
  actions?: React.ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  titleAccent,
  description,
  icon: Icon,
  actions,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {Icon && <Icon size={11} />}
            <span>{eyebrow}</span>
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em]">
            {title}{" "}
            {titleAccent && (
              <span className="text-muted-foreground">{titleAccent}</span>
            )}
          </h1>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </motion.div>
  )
}
