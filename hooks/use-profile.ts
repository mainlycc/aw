import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getProfile } from '@/lib/supabase/queries'
import type { Profile } from '@/types'

/**
 * Hook do pobierania profilu zalogowanego użytkownika
 * Zwraca profil z informacją o roli (admin/tutor)
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Pobierz aktualnego użytkownika
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setProfile(null)
          setLoading(false)
          return
        }

        // Pobierz profil użytkownika
        const { data, error } = await getProfile(supabase, user.id)
        
        if (error) {
          setError(error.message)
          setProfile(null)
        } else {
          setProfile(data)
          setError(null)
        }
      } catch (err) {
        setError('Błąd podczas pobierania profilu')
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()

    // Nasłuchuj na zmiany autoryzacji
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return { profile, loading, error }
}

