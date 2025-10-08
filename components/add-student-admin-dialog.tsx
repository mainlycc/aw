"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { IconUserPlus, IconX } from "@tabler/icons-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

export function AddStudentAdminDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Formularz dla nowego ucznia
  const [studentData, setStudentData] = useState({
    first_name: "",
    last_name: "",
    notes: "",
    active: true,
  })

  // Rodzice nowego ucznia
  const [parents, setParents] = useState<Array<{
    first_name: string
    last_name: string
    email: string
    phone: string
    relation: 'guardian' | 'mother' | 'father' | 'grandparent' | 'other'
    is_primary: boolean
  }>>([])

  // Formularz nowego rodzica
  const [parentForm, setParentForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    relation: "guardian" as 'guardian' | 'mother' | 'father' | 'grandparent' | 'other',
    is_primary: false
  })

  const getRelationLabel = (relation: string) => {
    switch(relation) {
      case 'mother': return 'Matka'
      case 'father': return 'Ojciec'
      case 'guardian': return 'Opiekun'
      case 'grandparent': return 'Dziadek/Babcia'
      case 'other': return 'Inne'
      default: return relation
    }
  }

  const handleAddParent = () => {
    if (!parentForm.first_name || !parentForm.last_name) {
      toast.error("Wypełnij wymagane pola", {
        description: "Imię i nazwisko rodzica są wymagane"
      })
      return
    }

    // Jeśli to jest pierwszy rodzic, ustaw jako główny kontakt
    const isFirst = parents.length === 0

    setParents([
      ...parents, 
      { 
        ...parentForm,
        is_primary: isFirst ? true : parentForm.is_primary
      }
    ])
    
    // Reset formularza
    setParentForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      relation: "guardian",
      is_primary: false
    })
    
    toast.success("Rodzic dodany do listy")
  }

  const handleRemoveParent = (index: number) => {
    const updated = parents.filter((_, i) => i !== index)
    setParents(updated)
    toast.success("Rodzic usunięty z listy")
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Walidacja
      if (!studentData.first_name || !studentData.last_name) {
        toast.error("Wypełnij wymagane pola", {
          description: "Imię i nazwisko są wymagane"
        })
        setIsLoading(false)
        return
      }

      // Pobierz aktualnego użytkownika
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Błąd autoryzacji")
        setIsLoading(false)
        return
      }

      // 1. Utwórz nowego ucznia
      const { data: studentRecord, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: studentData.first_name.trim(),
          last_name: studentData.last_name.trim(),
          notes: studentData.notes || null,
          active: studentData.active,
          created_by: user.id
        } as any)
        .select()
        .single()

      if (studentError) {
        console.error("Student error:", studentError)
        toast.error("Błąd podczas tworzenia ucznia", {
          description: studentError.message
        })
        setIsLoading(false)
        return
      }

      // 2. Dodaj rodziców (jeśli są)
      if (parents.length > 0) {
        for (const parentData of parents) {
          // Utwórz rodzica
          const { data: parentRecord, error: parentError } = await supabase
            .from('parents')
            .insert({
              first_name: parentData.first_name.trim(),
              last_name: parentData.last_name.trim(),
              email: parentData.email.trim() || null,
              phone: parentData.phone.trim() || null
            } as any)
            .select()
            .single()

          if (parentError) {
            console.error("Parent error:", parentError)
            // Kontynuuj mimo błędu z rodzicem
            continue
          }

          // Połącz rodzica z uczniem
          await supabase
            .from('student_parents')
            .insert({
              student_id: (studentRecord as any).id,
              parent_id: (parentRecord as any).id,
              relation: parentData.relation,
              is_primary: parentData.is_primary
            } as any)
        }
      }

      toast.success("Uczeń został dodany", {
        description: `${studentData.first_name} ${studentData.last_name} został pomyślnie utworzony${parents.length > 0 ? ` z ${parents.length} rodzicem/ami` : ''}`
      })

      // Reset formularzy
      setStudentData({
        first_name: "",
        last_name: "",
        notes: "",
        active: true,
      })
      setParents([])
      setParentForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        relation: "guardian",
        is_primary: false
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("Wystąpił nieoczekiwany błąd")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconUserPlus className="h-4 w-4" />
          Dodaj ucznia
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dodaj nowego ucznia</DialogTitle>
          <DialogDescription>
            Utwórz nowego ucznia w systemie
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                Imię <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                placeholder="Jan"
                value={studentData.first_name}
                onChange={(e) => setStudentData({ 
                  ...studentData, 
                  first_name: e.target.value 
                })}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">
                Nazwisko <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                placeholder="Kowalski"
                value={studentData.last_name}
                onChange={(e) => setStudentData({ 
                  ...studentData, 
                  last_name: e.target.value 
                })}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={studentData.active}
              onCheckedChange={(checked) => setStudentData({ 
                ...studentData, 
                active: checked as boolean 
              })}
              disabled={isLoading}
            />
            <Label htmlFor="active" className="cursor-pointer">
              Uczeń aktywny
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notatki</Label>
            <Textarea
              id="notes"
              placeholder="Dodatkowe informacje o uczniu..."
              value={studentData.notes}
              onChange={(e) => setStudentData({ 
                ...studentData, 
                notes: e.target.value 
              })}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Rodzice / Opiekunowie (opcjonalnie)</h4>
            
            {/* Lista dodanych rodziców */}
            {parents.length > 0 && (
              <div className="space-y-2 mb-4">
                {parents.map((parent, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium">
                        {parent.first_name} {parent.last_name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {getRelationLabel(parent.relation)}
                      </Badge>
                      {parent.is_primary && (
                        <Badge variant="outline" className="text-xs">Główny</Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveParent(index)}
                      disabled={isLoading}
                    >
                      <IconX className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Formularz dodawania rodzica */}
            <div className="space-y-3 p-3 bg-muted/50 rounded-md">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Imię rodzica"
                  value={parentForm.first_name}
                  onChange={(e) => setParentForm({ 
                    ...parentForm, 
                    first_name: e.target.value 
                  })}
                  disabled={isLoading}
                />
                <Input
                  placeholder="Nazwisko rodzica"
                  value={parentForm.last_name}
                  onChange={(e) => setParentForm({ 
                    ...parentForm, 
                    last_name: e.target.value 
                  })}
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={parentForm.email}
                  onChange={(e) => setParentForm({ 
                    ...parentForm, 
                    email: e.target.value 
                  })}
                  disabled={isLoading}
                />
                <Input
                  type="tel"
                  placeholder="Telefon"
                  value={parentForm.phone}
                  onChange={(e) => setParentForm({ 
                    ...parentForm, 
                    phone: e.target.value 
                  })}
                  disabled={isLoading}
                />
              </div>
              <Select
                value={parentForm.relation}
                onValueChange={(value: any) => setParentForm({ 
                  ...parentForm, 
                  relation: value 
                })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guardian">Opiekun prawny</SelectItem>
                  <SelectItem value="mother">Matka</SelectItem>
                  <SelectItem value="father">Ojciec</SelectItem>
                  <SelectItem value="grandparent">Dziadek/Babcia</SelectItem>
                  <SelectItem value="other">Inne</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddParent}
                disabled={isLoading}
                className="w-full"
              >
                <IconUserPlus className="h-4 w-4" />
                Dodaj rodzica do listy
              </Button>
            </div>
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
              {isLoading ? "Dodawanie..." : "Dodaj ucznia"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

