"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Student } from "@/types"

export interface TutorStudent {
  id: string
  first_name: string
  last_name: string
  active: boolean
}

export function useTutorStudents() {
  const [students, setStudents] = useState<TutorStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true)
        const supabase = createClient()

        // Pobierz zalogowanego użytkownika
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError("Nie jesteś zalogowany")
          return
        }

        // Pobierz profil użytkownika
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!profile) {
          setError("Nie znaleziono profilu")
          return
        }

        // Pobierz dane korepetytora
        const { data: tutor } = await supabase
          .from('tutors')
          .select('id')
          .eq('profile_id', profile.id)
          .single()

        if (!tutor) {
          setError("Nie znaleziono danych korepetytora")
          return
        }

        // Pobierz uczniów przypisanych do tego korepetytora przez enrollments
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            student_id,
            students (
              id,
              first_name,
              last_name,
              active
            )
          `)
          .eq('tutor_id', tutor.id)
          .eq('status', 'active')

        if (enrollmentsError) {
          setError(enrollmentsError.message)
          return
        }

        // Usuń duplikaty uczniów (jeśli uczeń ma wiele przedmiotów)
        const uniqueStudents = Array.from(
          new Map(
            enrollments
              ?.filter(e => e.students)
              .map(e => e.students as Student)
              .map(s => [s.id, s])
          ).values()
        )

        setStudents(uniqueStudents as TutorStudent[])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd")
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  return { students, loading, error }
}

