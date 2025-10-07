import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/supabase/queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Profile } from "@/types"

// Wymuś dynamiczne renderowanie - zawsze pobieraj świeże dane
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Strona rozliczeń tutora
 * Wyświetla informacje o wynagrodzeniach i rozliczeniach
 */
export default async function TutorRozliczeniaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Musisz być zalogowany, aby zobaczyć rozliczenia.</p>
      </div>
    )
  }

  const { data: profileData } = await getProfile(supabase, user.id)
  const profile = profileData as Profile | null
  
  if (!profile || profile.role !== 'tutor') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ta strona jest dostępna tylko dla korepetytorów.</p>
      </div>
    )
  }

  // Pobierz dane korepetytora
  const { data: tutorData } = await supabase
    .from('tutors')
    .select('*')
    .eq('profile_id', profile.id)
    .single()

  if (!tutorData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rozliczenia</h1>
          <p className="text-muted-foreground">
            Twój profil korepetytora nie został jeszcze utworzony. Skontaktuj się z administratorem.
          </p>
        </div>
      </div>
    )
  }

  // TODO: Pobierz dane rozliczeń z bazy danych
  // Na razie używamy przykładowych danych
  const totalEarnings = 0
  const currentMonthEarnings = 0
  const pendingPayments = 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Rozliczenia
          </h1>
          <p className="text-muted-foreground">
            Twoje wynagrodzenia i płatności
          </p>
        </div>
      </div>

      {/* Statystyki */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Zarobki całkowite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEarnings.toFixed(2)} zł</div>
            <p className="text-xs text-muted-foreground">
              Suma wszystkich wypłat
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Zarobki w tym miesiącu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMonthEarnings.toFixed(2)} zł
            </div>
            <p className="text-xs text-muted-foreground">
              Bieżący miesiąc
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Oczekujące płatności
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingPayments.toFixed(2)} zł
            </div>
            <p className="text-xs text-muted-foreground">
              Do wypłaty
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela rozliczeń */}
      <Card>
        <CardHeader>
          <CardTitle>Historia rozliczeń</CardTitle>
          <CardDescription>
            Lista wszystkich płatności i wypłat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Brak danych do wyświetlenia
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Tutaj pojawią się Twoje rozliczenia i historia płatności
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

