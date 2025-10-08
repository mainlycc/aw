import { TutoringCalendar } from "@/components/tutoring-calendar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="mb-4 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-1">Rezerwacja Korepetycji</h1>
          <p className="text-muted-foreground text-lg leading-tight">
            Wybierz przedmiot i zarezerwuj termin z najlepszymi nauczycielami
          </p>
        </div>
        <TutoringCalendar />
      </div>
    </div>
  )
}
