import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/supabase/queries"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Jeśli użytkownik jest zalogowany, przekieruj na odpowiednią stronę w zależności od roli
  if (user) {
    // Pobierz profil użytkownika z rolą
    const { data: profile } = await getProfile(supabase, user.id)
    
    if (profile) {
      const userRole = (profile as any).role
      if (userRole === 'admin') {
        redirect("/admin")
      } else if (userRole === 'tutor') {
        redirect("/tutor")
      }
    }
    
    // Fallback jeśli rola nie jest zdefiniowana
    redirect("/dashboard")
  }

  // Jeśli nie jest zalogowany, przekieruj na login
  redirect("/login")
}
