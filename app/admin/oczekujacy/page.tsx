import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { PendingUsersDataTable, PendingUsersDataTableSkeleton } from "@/components/pending-users-data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

async function PendingUsersContent() {
  const supabase = await createClient()

  // Pobierz użytkowników z rolą 'pending'
  const { data: pendingUsers, error } = await supabase
    .from('profiles')
    .select('id, email, created_at')
    .eq('role', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending users:', error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Błąd</CardTitle>
          <CardDescription>
            Nie udało się pobrać listy oczekujących użytkowników
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oczekujący użytkownicy</CardTitle>
        <CardDescription>
          Lista użytkowników oczekujących na zatwierdzenie. 
          Zatwierdź ich aby mogli się zalogować do aplikacji.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PendingUsersDataTable initialUsers={pendingUsers || []} />
      </CardContent>
    </Card>
  )
}

export default function PendingUsersPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Oczekujący użytkownicy</h1>
      </div>

      <Suspense fallback={
        <Card>
          <CardHeader>
            <CardTitle>Oczekujący użytkownicy</CardTitle>
            <CardDescription>
              Ładowanie...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PendingUsersDataTableSkeleton />
          </CardContent>
        </Card>
      }>
        <PendingUsersContent />
      </Suspense>
    </div>
  )
}

