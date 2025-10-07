"use client"

import * as React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface PageTitleContextType {
  title: string
  setTitle: (title: string) => void
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined)

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState("Akademia Wiedzy")

  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitle(newTitle?: string) {
  const context = useContext(PageTitleContext)
  
  if (!context) {
    throw new Error("usePageTitle must be used within PageTitleProvider")
  }

  useEffect(() => {
    if (newTitle) {
      context.setTitle(newTitle)
      
      // Cleanup: przywróć domyślny tytuł przy odmontowaniu
      return () => {
        context.setTitle("Akademia Wiedzy")
      }
    }
  }, [newTitle, context])

  return context
}

