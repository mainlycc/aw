'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { IconEdit, IconLoader2 } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Subject {
  id: string
  name: string
}

interface TutorSubject {
  subject_id: string
  level: string
  subjects: {
    id: string
    name: string
  }
}

interface Tutor {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  rate: number | null
  bio: string | null
  active: boolean
  tutor_subjects: TutorSubject[]
}

interface EditTutorAdminDialogProps {
  tutor: Tutor
  allSubjects: Subject[]
}

export function EditTutorAdminDialog({ tutor, allSubjects }: EditTutorAdminDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Dane formularza
  const [formData, setFormData] = useState({
    first_name: tutor.first_name,
    last_name: tutor.last_name,
    email: tutor.email || '',
    phone: tutor.phone || '',
    rate: tutor.rate || 0,
    bio: tutor.bio || '',
    active: tutor.active,
  })

  // Przedmioty korepetytora z poziomami
  const [selectedSubjects, setSelectedSubjects] = useState<Array<{subject_id: string, level: string}>>(
    tutor.tutor_subjects.map(ts => ({
      subject_id: ts.subject_id,
      level: ts.level
    }))
  )

  // Reset formularza przy otwarciu dialogu
  useEffect(() => {
    if (open) {
      setFormData({
        first_name: tutor.first_name,
        last_name: tutor.last_name,
        email: tutor.email || '',
        phone: tutor.phone || '',
        rate: tutor.rate || 0,
        bio: tutor.bio || '',
        active: tutor.active,
      })
      setSelectedSubjects(tutor.tutor_subjects.map(ts => ({
        subject_id: ts.subject_id,
        level: ts.level
      })))
    }
  }, [open, tutor])

  const toggleSubject = (subjectId: string, checked: boolean) => {
    if (checked) {
      // Dodaj przedmiot z domyślnym poziomem 'basic'
      setSelectedSubjects(prev => [...prev, { subject_id: subjectId, level: 'basic' }])
    } else {
      // Usuń przedmiot
      setSelectedSubjects(prev => prev.filter(s => s.subject_id !== subjectId))
    }
  }

  const updateSubjectLevel = (subjectId: string, level: string) => {
    setSelectedSubjects(prev =>
      prev.map(s => s.subject_id === subjectId ? { ...s, level } : s)
    )
  }

  const handleSave = async () => {
    // Walidacja
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('Uzupełnij wymagane pola', {
        description: 'Imię i nazwisko są wymagane',
      })
      return
    }

    setIsSaving(true)
    try {
      // Aktualizuj dane korepetytora
      const { error: tutorError } = await (supabase
        .from('tutors') as any)
        .update({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          rate: formData.rate || null,
          bio: formData.bio.trim() || null,
          active: formData.active,
        })
        .eq('id', tutor.id)

      if (tutorError) throw tutorError

      // Usuń wszystkie stare przedmioty
      const { error: deleteError } = await (supabase
        .from('tutor_subjects') as any)
        .delete()
        .eq('tutor_id', tutor.id)

      if (deleteError) throw deleteError

      // Dodaj nowe przedmioty z poziomami
      if (selectedSubjects.length > 0) {
        const { error: insertError } = await (supabase
          .from('tutor_subjects') as any)
          .insert(
            selectedSubjects.map(subject => ({
              tutor_id: tutor.id,
              subject_id: subject.subject_id,
              level: subject.level,
            }))
          )

        if (insertError) throw insertError
      }

      toast.success('Dane zostały zapisane', {
        description: 'Zmiany zostały pomyślnie zapisane',
      })
      
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error('Error saving tutor:', error)
      toast.error('Błąd', {
        description: error.message || 'Nie udało się zapisać zmian',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <IconEdit className="size-4 mr-2" />
          Edytuj
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edytuj dane korepetytora</DialogTitle>
          <DialogDescription>
            Zaktualizuj dane osobowe i informacje o korepetytorze
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Podstawowe dane */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                Imię <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Jan"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Nazwisko <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Kowalski"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jan.kowalski@example.com"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+48 123 456 789"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Stawka (zł/h)</Label>
              <Input
                id="rate"
                type="number"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                placeholder="50"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, active: checked as boolean })
                  }
                  disabled={isSaving}
                />
                <label htmlFor="active" className="text-sm cursor-pointer">
                  Korepetytorzy aktywny
                </label>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Opis / Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              placeholder="Dodaj opis korepetytora..."
              disabled={isSaving}
            />
          </div>

          {/* Przedmioty z poziomami */}
          <div className="space-y-2">
            <Label>Przedmioty i poziomy nauczania</Label>
            <div className="space-y-3 p-4 border rounded-md max-h-96 overflow-y-auto">
              {allSubjects.map((subject) => {
                const selectedSubject = selectedSubjects.find(s => s.subject_id === subject.id)
                const isSelected = !!selectedSubject
                
                return (
                  <div key={subject.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => toggleSubject(subject.id, checked as boolean)}
                        disabled={isSaving}
                      />
                      <label 
                        htmlFor={`subject-${subject.id}`} 
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {subject.name}
                      </label>
                    </div>
                    
                    {isSelected && (
                      <div className="ml-6 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Poziom:</span>
                        <Select
                          value={selectedSubject.level}
                          onValueChange={(value) => updateSubjectLevel(subject.id, value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="h-8 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Podstawowy</SelectItem>
                            <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
                            <SelectItem value="advanced">Zaawansowany</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {allSubjects.length === 0 && (
              <p className="text-sm text-muted-foreground">Brak dostępnych przedmiotów</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <IconLoader2 className="size-4 mr-2 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              'Zapisz zmiany'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

