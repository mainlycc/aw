import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/supabase/queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Dashboard dla tutora
 * Główna strona panelu korepetytora
 */
export default async function TutorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let tutorData = null
  if (user) {
    const { data: profile } = await getProfile(supabase, user.id)
    if (profile) {
      // Pobierz dane tutora
      const { data } = await supabase
        .from('tutors')
        .select('*')
        .eq('profile_id', profile.id)
        .single()
      
      tutorData = data
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Tutora
        </h1>
        <p className="text-muted-foreground">
          Witaj, {tutorData ? `${tutorData.first_name} ${tutorData.last_name}` : 'Tutorze'}! 👋
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Aktywne Zapisy</CardTitle>
            <CardDescription>Uczniowie w tym semestrze</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-2">
              Wkrótce dostępne
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Przedmioty</CardTitle>
            <CardDescription>Prowadzone kursy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-2">
              Wkrótce dostępne
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nadchodzące Lekcje</CardTitle>
            <CardDescription>W tym tygodniu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-2">
              Wkrótce dostępne
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Szybki Start</CardTitle>
          <CardDescription>Najczęstsze akcje</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Zobacz listę swoich uczniów
          </p>
          <p className="text-sm text-muted-foreground">
            • Zarządzaj harmonogramem lekcji
          </p>
          <p className="text-sm text-muted-foreground">
            • Sprawdź postępy uczniów
          </p>
          <p className="text-sm text-muted-foreground">
            • Zaktualizuj swój profil
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

