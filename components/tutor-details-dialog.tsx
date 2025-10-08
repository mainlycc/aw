"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TutorDetailsDialogProps {
  tutorId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TutorDetails {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  rate: number | null
  bio: string | null
  active: boolean
  tutor_subjects: Array<{
    level: string
    subjects: {
      name: string
    }
  }>
}

export function TutorDetailsDialog({ 
  tutorId,
  open,
  onOpenChange 
}: TutorDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [tutorDetails, setTutorDetails] = useState<TutorDetails | null>(null)

  // Formularz edycji korepetytora
  const [tutorData, setTutorData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    rate: "",
    bio: "",
    active: true,
  })

  // Załaduj dane korepetytora przy otwarciu dialogu
  useEffect(() => {
    if (tutorId && open) {
      fetchTutorDetails()
    }
  }, [tutorId, open])

  const fetchTutorDetails = async () => {
    if (!tutorId) return
    
    setIsFetching(true)
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select(`
          *,
          tutor_subjects (
            level,
            subjects (
              name
            )
          )
        `)
        .eq('id', tutorId)
        .single()

      if (error) {
        console.error('Błąd podczas pobierania danych korepetytora:', error)
        toast.error("Nie udało się pobrać danych korepetytora")
        return
      }

      if (data) {
        setTutorDetails(data as any)
        setTutorData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || "",
          phone: data.phone || "",
          rate: data.rate?.toString() || "",
          bio: data.bio || "",
          active: data.active,
        })
      }
    } catch (error) {
      console.error('Błąd:', error)
      toast.error("Wystąpił nieoczekiwany błąd")
    } finally {
      setIsFetching(false)
    }
  }

  const getLevelLabel = (level: string) => {
    switch(level) {
      case 'basic': return 'Podstawowy'
      case 'intermediate': return 'Średni'
      case 'advanced': return 'Zaawansowany'
      case 'expert': return 'Ekspercki'
      default: return level
    }
  }

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'basic': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-orange-100 text-orange-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      case 'expert': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tutorId) return

    if (!tutorData.first_name || !tutorData.last_name) {
      toast.error("Wypełnij wymagane pola", {
        description: "Imię i nazwisko są wymagane"
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('tutors')
        .update({
          first_name: tutorData.first_name.trim(),
          last_name: tutorData.last_name.trim(),
          email: tutorData.email.trim() || null,
          phone: tutorData.phone.trim() || null,
          rate: tutorData.rate ? parseFloat(tutorData.rate) : null,
          bio: tutorData.bio.trim() || null,
          active: tutorData.active,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', tutorId)

      if (error) {
        console.error('Błąd podczas zapisywania:', error)
        toast.error("Nie udało się zapisać danych", {
          description: error.message
        })
        setIsLoading(false)
        return
      }

      toast.success("Dane korepetytora zostały zaktualizowane")
      setIsEditing(false)
      fetchTutorDetails()
      router.refresh()
    } catch (error: any) {
      console.error('Błąd:', error)
      toast.error("Wystąpił nieoczekiwany błąd", {
        description: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!tutorId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tutorDetails ? `${tutorDetails.first_name} ${tutorDetails.last_name}` : "Szczegóły korepetytora"}
          </DialogTitle>
          <DialogDescription>
            Informacje o korepetytorze i prowadzonych przedmiotach
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Ładowanie danych...
          </div>
        ) : (
          <>
            {!isEditing ? (
              // Widok szczegółów
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dane kontaktowe</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <div className="font-medium">{tutorDetails?.email || "—"}</div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Telefon</Label>
                        <div className="font-medium">{tutorDetails?.phone || "—"}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Stawka godzinowa</Label>
                        <div className="font-medium">
                          {tutorDetails?.rate ? `${tutorDetails.rate} zł/h` : "—"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Status</Label>
                        <div>
                          <Badge variant={tutorDetails?.active ? "default" : "secondary"}>
                            {tutorDetails?.active ? "Aktywny" : "Nieaktywny"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {tutorDetails?.bio && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Bio</Label>
                        <div className="text-sm mt-1">{tutorDetails.bio}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {tutorDetails?.tutor_subjects && tutorDetails.tutor_subjects.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Prowadzone przedmioty</CardTitle>
                      <CardDescription>
                        Przedmioty z poziomami nauczania
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tutorDetails.tutor_subjects.map((ts: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 border rounded">
                            <span className="font-medium">{ts.subjects?.name || "—"}</span>
                            <Badge className={getLevelColor(ts.level)}>
                              {getLevelLabel(ts.level)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Zamknij
                  </Button>
                  <Button onClick={() => setIsEditing(true)}>
                    Edytuj dane
                  </Button>
                </div>
              </div>
            ) : (
              // Formularz edycji
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_first_name">
                      Imię <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit_first_name"
                      placeholder="Jan"
                      value={tutorData.first_name}
                      onChange={(e) => setTutorData({ 
                        ...tutorData, 
                        first_name: e.target.value 
                      })}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_last_name">
                      Nazwisko <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit_last_name"
                      placeholder="Kowalski"
                      value={tutorData.last_name}
                      onChange={(e) => setTutorData({ 
                        ...tutorData, 
                        last_name: e.target.value 
                      })}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_email">Email</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      placeholder="jan.kowalski@example.com"
                      value={tutorData.email}
                      onChange={(e) => setTutorData({ 
                        ...tutorData, 
                        email: e.target.value 
                      })}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_phone">Telefon</Label>
                    <Input
                      id="edit_phone"
                      type="tel"
                      placeholder="+48 123 456 789"
                      value={tutorData.phone}
                      onChange={(e) => setTutorData({ 
                        ...tutorData, 
                        phone: e.target.value 
                      })}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_rate">Stawka godzinowa (zł/h)</Label>
                  <Input
                    id="edit_rate"
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={tutorData.rate}
                    onChange={(e) => setTutorData({ 
                      ...tutorData, 
                      rate: e.target.value 
                    })}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_active"
                    checked={tutorData.active}
                    onCheckedChange={(checked) => setTutorData({ 
                      ...tutorData, 
                      active: checked as boolean 
                    })}
                    disabled={isLoading}
                  />
                  <Label htmlFor="edit_active" className="cursor-pointer">
                    Korepetytor aktywny
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_bio">Bio / Opis</Label>
                  <Textarea
                    id="edit_bio"
                    placeholder="Krótki opis doświadczenia i umiejętności..."
                    value={tutorData.bio}
                    onChange={(e) => setTutorData({ 
                      ...tutorData, 
                      bio: e.target.value 
                    })}
                    disabled={isLoading}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      // Przywróć oryginalne dane
                      if (tutorDetails) {
                        setTutorData({
                          first_name: tutorDetails.first_name,
                          last_name: tutorDetails.last_name,
                          email: tutorDetails.email || "",
                          phone: tutorDetails.phone || "",
                          rate: tutorDetails.rate?.toString() || "",
                          bio: tutorDetails.bio || "",
                          active: tutorDetails.active,
                        })
                      }
                    }}
                    disabled={isLoading}
                  >
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

