"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { IconUserEdit, IconLoader2, IconPlus, IconX } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Subject {
  id: string
  name: string
  color?: string | null
}

interface TutorSubject {
  subject_id: string
  level: 'basic' | 'intermediate' | 'advanced'
}

interface TutorData {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  rate?: number | null
  bio?: string
  active?: boolean
  profile_id?: string | null
}

interface EditTutorProfileDialogProps {
  tutor: TutorData
  isNewProfile?: boolean
  existingSubjects?: Array<{
    id: string
    name: string
    level: 'basic' | 'intermediate' | 'advanced'
  }>
}

export function EditTutorProfileDialog({ 
  tutor,
  isNewProfile = false,
  existingSubjects = []
}: EditTutorProfileDialogProps) {
  const [open, setOpen] = useState(isNewProfile) // Auto-otwórz dla nowego profilu
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    first_name: tutor.first_name || '',
    last_name: tutor.last_name || '',
    email: tutor.email || '',
    phone: tutor.phone || '',
    bio: tutor.bio || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Zarządzanie przedmiotami
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [tutorSubjects, setTutorSubjects] = useState<TutorSubject[]>(
    existingSubjects.map(s => ({
      subject_id: s.id,
      level: s.level
    }))
  )
  const [newSubject, setNewSubject] = useState({
    subject_id: '',
    level: 'basic' as 'basic' | 'intermediate' | 'advanced'
  })

  // Pobierz wszystkie przedmioty
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, color')
        .eq('active', true)
        .order('name')

      if (!error && data) {
        setAllSubjects(data)
      }
    }

    if (open) {
      fetchSubjects()
    }
  }, [open, supabase])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Wyczyść błąd dla tego pola
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name || formData.first_name.length < 2) {
      newErrors.first_name = 'Imię musi mieć co najmniej 2 znaki'
    }

    if (!formData.last_name || formData.last_name.length < 2) {
      newErrors.last_name = 'Nazwisko musi mieć co najmniej 2 znaki'
    }

    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Nieprawidłowy format email'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddSubject = () => {
    if (!newSubject.subject_id) {
      toast.error("Wybierz przedmiot")
      return
    }

    // Sprawdź czy przedmiot już nie jest dodany
    if (tutorSubjects.some(s => s.subject_id === newSubject.subject_id)) {
      toast.error("Ten przedmiot jest już na liście")
      return
    }

    setTutorSubjects([...tutorSubjects, { ...newSubject }])
    setNewSubject({
      subject_id: '',
      level: 'basic'
    })
    toast.success("Przedmiot dodany")
  }

  const handleRemoveSubject = (subjectId: string) => {
    setTutorSubjects(tutorSubjects.filter(s => s.subject_id !== subjectId))
    toast.success("Przedmiot usunięty")
  }

  const getSubjectName = (subjectId: string) => {
    return allSubjects.find(s => s.id === subjectId)?.name || ''
  }

  const getLevelLabel = (level: string) => {
    switch(level) {
      case 'basic': return 'Podstawowy'
      case 'intermediate': return 'Średni'
      case 'advanced': return 'Zaawansowany'
      default: return level
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Formularz zawiera błędy", {
        description: "Sprawdź wypełnione pola"
      })
      return
    }

    setIsLoading(true)

    try {
      const tutorPayload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        bio: formData.bio.trim() || null,
        active: true,
        profile_id: tutor.profile_id,
        updated_at: new Date().toISOString(),
      }

      console.log('Zapisywanie profilu tutora:', {
        isNewProfile,
        tutorId: tutor.id,
        profileId: tutor.profile_id,
        payload: tutorPayload,
        subjects: tutorSubjects
      })

      let savedTutorId: string
      let result

      if (isNewProfile) {
        // Twórz nowy rekord
        console.log('Tworzenie nowego profilu...')
        result = await supabase
          .from('tutors')
          .insert(tutorPayload)
          .select()
        
        if (result.error) {
          console.error('Błąd Supabase:', result.error)
          throw result.error
        }

        if (!result.data || result.data.length === 0) {
          throw new Error('Nie otrzymano danych po zapisie')
        }

        savedTutorId = result.data[0].id
      } else {
        // Aktualizuj istniejący rekord
        console.log('Aktualizacja istniejącego profilu...')
        result = await supabase
          .from('tutors')
          .update(tutorPayload)
          .eq('id', tutor.id)
          .select()
        
        if (result.error) {
          console.error('Błąd Supabase:', result.error)
          throw result.error
        }

        savedTutorId = tutor.id
      }

      // Zapisz przedmioty tutora
      if (tutorSubjects.length > 0) {
        // Usuń stare przypisania
        await supabase
          .from('tutor_subjects')
          .delete()
          .eq('tutor_id', savedTutorId)

        // Dodaj nowe przypisania
        const subjectsToInsert = tutorSubjects.map(s => ({
          tutor_id: savedTutorId,
          subject_id: s.subject_id,
          level: s.level
        }))

        const { error: subjectsError } = await supabase
          .from('tutor_subjects')
          .insert(subjectsToInsert)

        if (subjectsError) {
          console.error('Błąd podczas zapisywania przedmiotów:', subjectsError)
          toast.warning("Profil zapisany, ale wystąpił błąd z przedmiotami", {
            description: subjectsError.message
          })
        }
      }

      toast.success(isNewProfile ? "Profil został utworzony" : "Profil został zaktualizowany", {
        description: "Dane zostały pomyślnie zapisane"
      })
      
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error('Błąd podczas zapisywania profilu:', error)
      toast.error("Nie udało się zapisać profilu", {
        description: error.message || "Sprawdź uprawnienia w Supabase (RLS policies)"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isNewProfile ? "default" : "outline"}>
          <IconUserEdit className="h-4 w-4" />
          {isNewProfile ? "Uzupełnij profil" : "Edytuj profil"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isNewProfile ? "Uzupełnij swój profil" : "Edytuj profil tutora"}
          </DialogTitle>
          <DialogDescription>
            {isNewProfile 
              ? "Aby móc dodawać uczniów i zarządzać nimi, wypełnij swoje dane kontaktowe"
              : "Zaktualizuj swoje dane kontaktowe i informacje o sobie"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                Imię <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                placeholder="Jan"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={isLoading}
                className={errors.first_name ? 'border-destructive' : ''}
                required
              />
              {errors.first_name && (
                <p className="text-xs text-destructive">{errors.first_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">
                Nazwisko <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                placeholder="Kowalski"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={isLoading}
                className={errors.last_name ? 'border-destructive' : ''}
                required
              />
              {errors.last_name && (
                <p className="text-xs text-destructive">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jan.kowalski@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+48 123 456 789"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Przedmioty i poziomy nauczania</Label>
            
            {/* Lista dodanych przedmiotów */}
            {tutorSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                {tutorSubjects.map((subject) => (
                  <div key={subject.subject_id} className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {getSubjectName(subject.subject_id)}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{
                        backgroundColor: subject.level === 'advanced' ? '#fee2e2' : 
                                       subject.level === 'intermediate' ? '#fed7aa' : '#dcfce7',
                        color: subject.level === 'advanced' ? '#dc2626' : 
                               subject.level === 'intermediate' ? '#ea580c' : '#16a34a'
                      }}
                    >
                      {getLevelLabel(subject.level)}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleRemoveSubject(subject.subject_id)}
                      disabled={isLoading}
                    >
                      <IconX className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Dodawanie nowego przedmiotu */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Select
                  value={newSubject.subject_id}
                  onValueChange={(value) => setNewSubject({ ...newSubject, subject_id: value })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz przedmiot" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSubjects
                      .filter(s => !tutorSubjects.some(ts => ts.subject_id === s.id))
                      .map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select
                  value={newSubject.level}
                  onValueChange={(value: 'basic' | 'intermediate' | 'advanced') => 
                    setNewSubject({ ...newSubject, level: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Podstawowy</SelectItem>
                    <SelectItem value="intermediate">Średni</SelectItem>
                    <SelectItem value="advanced">Zaawansowany</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSubject}
              disabled={isLoading || !newSubject.subject_id}
              className="w-full"
            >
              <IconPlus className="h-4 w-4" />
              Dodaj przedmiot
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">O mnie</Label>
            <Textarea
              id="bio"
              placeholder="Napisz kilka słów o sobie, swoim doświadczeniu i podejściu do nauczania..."
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              disabled={isLoading}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/2000 znaków
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <IconLoader2 className="h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  {isNewProfile ? "Utwórz profil" : "Zapisz zmiany"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

