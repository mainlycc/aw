"use client"

import { usePageTitle } from "@/lib/contexts/page-title-context"

export function PageTitleSetter({ title }: { title: string }) {
  usePageTitle(title)
  return null
}

