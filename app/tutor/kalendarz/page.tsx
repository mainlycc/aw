"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { WeeklySchedule } from "@/components/weekly-schedule"
import { createClient } from "@/lib/supabase/client"
import { usePageTitle } from "@/lib/contexts/page-title-context"

interface TutorData {
  id: string
  first_name?: string
  last_name?: string
}

export default function TutorKalendarzPage() {
  usePageTitle("Kalendarz")
  
  const router = useRouter()
  const supabase = createClient()
  const [tutor, setTutor] = useState<TutorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        // Pobierz profil tutora na podstawie profile_id
        const { data: tutorData } = await supabase
          .from("tutors")
          .select("*")
          .eq("profile_id", user.id)
          .maybeSingle()

        setTutor(tutorData)
        setLoading(false)
      } catch (error) {
        console.error("Błąd podczas pobierania danych:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Ładowanie...</p>
      </div>
    )
  }

  if (!tutor) {
    return (
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil nie znaleziony</h1>
        <p className="text-muted-foreground">
          Twój profil korepetytora nie został jeszcze utworzony. Skontaktuj się z administratorem.
        </p>
      </div>
    )
  }

  const fullName = [tutor.first_name, tutor.last_name].filter(Boolean).join(" ") || "Korepetytor"

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Twój grafik zajęć</p>
      <WeeklySchedule tutorName={fullName} />
    </div>
  )
}

