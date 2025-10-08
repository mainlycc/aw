"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { 
  IconX, 
  IconClock, 
  IconUser, 
  IconCalendar,
  IconEdit,
  IconTrash,
  IconCheck,
} from "@tabler/icons-react"
import { format } from "date-fns"
import type { TimeSlot, Subject, Level } from "@/components/tutoring-calendar"

interface ReservationDetailsPanelProps {
  isOpen: boolean
  onClose: () => void
  slot: TimeSlot | null
  subject: Subject | null
  level: Level | null
  onBook: (slot: TimeSlot, studentNote?: string) => Promise<void>
  onFormDataChange?: (data: {
    childName: string
    parentName: string
    email: string
    phone: string
  }) => void
}

export function ReservationDetailsPanel({ 
  isOpen, 
  onClose, 
  slot, 
  subject, 
  level,
  onBook,
  onFormDataChange
}: ReservationDetailsPanelProps) {
  const [note, setNote] = useState("")
  const [isBooking, setIsBooking] = useState(false)
  const [childName, setChildName] = useState("")
  const [parentName, setParentName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  // Aktualizuj dane formularza z debounce'owaniem
  useEffect(() => {
    if (!onFormDataChange) return

    const timeoutId = setTimeout(() => {
      onFormDataChange({
        childName,
        parentName,
        email,
        phone
      })
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [childName, parentName, email, phone, onFormDataChange])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const slotDate = slot ? new Date(slot.start) : null
  const slotEndDate = slot ? new Date(slot.end) : null

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "confirmed":
        return "Potwierdzona"
      case "pending":
        return "Oczekująca"
      case "cancelled":
        return "Anulowana"
      default:
        return "Dostępna"
    }
  }

  const handleEdit = () => {
    console.log("Edycja rezerwacji:", slot?.id)
  }

  const handleCancel = () => {
    console.log("Anulowanie rezerwacji:", slot?.id)
  }

  const handleJoinMeeting = () => {
    console.log("Dołączanie do spotkania")
  }

  const handleBooking = async () => {
    if (!slot) return
    setIsBooking(true)
    try {
      await onBook(slot, note)
      setNote("")
    } catch (error) {
      console.error("Booking failed:", error)
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {!slot ? "Wybór lekcji" : 
           slot?.type === "availability" ? "Rezerwacja lekcji" : "Szczegóły rezerwacji"}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <IconX className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Dane kontaktowe */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Dane kontaktowe</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Imię i nazwisko dziecka</label>
              <Input
                placeholder="Jan Kowalski"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Numer telefonu</label>
              <Input
                type="tel"
                placeholder="+48 600 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">E-mail</label>
              <Input
                type="email"
                placeholder="rodzic@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Imię i nazwisko rodzica</label>
              <Input
                placeholder="Anna Kowalska"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          {(!slot || (slot && slot.type !== "availability")) && (
            <Badge 
              variant="outline" 
              className={`${getStatusColor(!slot ? undefined : slot?.type === "availability" ? undefined : slot?.status)} text-sm px-3 py-1`}
            >
              {!slot ? "Wybierz termin" : getStatusLabel(slot?.status)}
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-2xl">{subject?.icon ?? ""}</span>
              {subject?.name ?? "Wybierz przedmiot"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {level && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <IconUser className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">Poziom: {level.name}</div>
                  <div className="text-xs text-muted-foreground">{level.description}</div>
                </div>
              </div>
            )}

            {slotDate && slotEndDate && (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconCalendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(slotDate)}
                    </div>
                    <div className="text-xs text-muted-foreground">Data zajęć</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconClock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      {format(slotDate, "HH:mm")} - {format(slotEndDate, "HH:mm")}
                    </div>
                    <div className="text-xs text-muted-foreground">Czas trwania: 60 minut</div>
                  </div>
                </div>
              </>
            )}

            {!slot && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Wybierz przedmiot i poziom, a następnie kliknij na dostępny termin w kalendarzu aby zobaczyć szczegóły.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        <div className="space-y-2">
          {slot && slot.type === "lesson" && slot.status === "confirmed" && (
            <Button 
              onClick={handleJoinMeeting}
              className="w-full gap-2"
              size="sm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 7l-7 5 7 5V7z" fill="currentColor"/><path d="M1 5h14a2 2 0 012 2v10a2 2 0 01-2 2H1a2 2 0 01-2-2V7a2 2 0 012-2z" fill="currentColor"/></svg>
              Dołącz do lekcji
            </Button>
          )}
          
          <div className="space-y-4">
            <Button 
              onClick={handleBooking} 
              disabled={isBooking || !slot || slot.type !== "availability"}
              className="w-full gap-2"
            >
              <IconCheck className="h-4 w-4" />
              {isBooking ? "Rezerwuję..." : "Zarezerwuj lekcję"}
            </Button>
          </div>

          {slot && slot.type === "lesson" && slot.status !== "cancelled" && (
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={handleEdit}
                className="gap-2"
                size="sm"
              >
                <IconEdit className="h-4 w-4" />
                Edytuj
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="gap-2 text-red-600 hover:text-red-700"
                size="sm"
              >
                <IconTrash className="h-4 w-4" />
                Anuluj
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
