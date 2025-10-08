import { GalleryVerticalEnd, Calendar } from "lucide-react"
import Link from "next/link"
import { RegisterForm } from "@/components/register-form"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
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
        <RegisterForm />
      </div>
    </div>
  )
}

