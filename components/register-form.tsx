'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)

    try {
      // Rejestracja użytkownika
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      })

      if (signUpError) {
        toast.error("Błąd rejestracji", {
          description: signUpError.message === "User already registered"
            ? "Użytkownik o tym adresie email już istnieje"
            : signUpError.message,
        })
        return
      }

      if (!authData.user) {
        toast.error("Błąd rejestracji", {
          description: "Nie udało się utworzyć konta",
        })
        return
      }

      // Profil zostanie automatycznie utworzony przez trigger w bazie danych
      // z domyślną rolą 'pending'

      toast.success("Rejestracja pomyślna", {
        description: "Twoje konto oczekuje na zatwierdzenie przez administratora. Otrzymasz powiadomienie email gdy będziesz mógł się zalogować.",
      })
      
      // Wyloguj użytkownika (nie może się logować dopóki admin nie zatwierdzi)
      await supabase.auth.signOut()
      
      // Przekieruj na stronę logowania
      router.push("/login")
    } catch (error) {
      toast.error("Wystąpił nieoczekiwany błąd")
      console.error("Register error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Utwórz nowe konto</CardTitle>
          <CardDescription>
            Wypełnij formularz aby założyć konto korepetytora
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fullName">Imię i nazwisko</FieldLabel>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jan Kowalski"
                  disabled={isLoading}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="twoj@email.com"
                  disabled={isLoading}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Hasło</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  disabled={isLoading}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">Potwierdź hasło</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  disabled={isLoading}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Rejestracja..." : "Zarejestruj się"}
                </Button>
                <FieldDescription className="text-center">
                  Masz już konto? <a href="/login" className="underline">Zaloguj się</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

