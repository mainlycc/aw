'use client'

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      toast.error("Błąd podczas wylogowania")
      return
    }

    toast.success("Wylogowano pomyślnie")
    router.push('/login')
    router.refresh()
  }

  return (
    <Button onClick={handleLogout} variant="outline">
      Wyloguj się
    </Button>
  )
}

