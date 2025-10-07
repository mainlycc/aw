"use client"

import { PageTitleProvider } from "@/lib/contexts/page-title-context"

export function PageTitleWrapper({ children }: { children: React.ReactNode }) {
  return <PageTitleProvider>{children}</PageTitleProvider>
}

