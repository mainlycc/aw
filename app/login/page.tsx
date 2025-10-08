import { GalleryVerticalEnd, Calendar, AlertCircle } from "lucide-react"
import Link from "next/link"
import { LoginForm } from "@/components/login-form"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = await searchParams
  const showPendingMessage = params.message === 'pending'

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      {/* Guzik Kalendarz na górze */}
      <div className="w-full max-w-sm flex justify-end">
        <Link href="/calendar">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="size-4" />
            Kalendarz
          </Button>
        </Link>
      </div>
      
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Akademia Wiedzy
        </a>
        
        {showPendingMessage && (
          <Alert variant="default" className="border-yellow-500 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Konto oczekuje na zatwierdzenie</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Twoje konto zostało utworzone i oczekuje na zatwierdzenie przez administratora. 
              Otrzymasz powiadomienie email gdy będziesz mógł się zalogować.
            </AlertDescription>
          </Alert>
        )}
        
        <LoginForm />
      </div>
    </div>
  )
}
