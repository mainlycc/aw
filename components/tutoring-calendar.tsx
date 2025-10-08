"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarView } from "./calendar-view"
import { ReservationDetailsPanel } from "@/components/reservation-details-panel"
import { ChevronLeft, ChevronRight, Calendar, List, Clock, CheckCircle2 } from "lucide-react"
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WebhookService } from "@/lib/webhook"

export interface Subject {
  id: string
  name: string
  icon: string
}

export interface Level {
  id: string
  name: string
  description: string
}

export interface TimeSlot {
  id: string
  type: "availability" | "lesson"
  subject_id: string
  level_id: string
  start: string
  end: string
  status?: "confirmed" | "pending" | "cancelled"
  price?: number
  teacher_name?: string
  note?: string
}

export interface Filters {
  level?: string
  mode?: string
  priceRange?: string
  language?: string
}

const subjects: Subject[] = [
  { id: "math", name: "Matematyka", icon: "📐" },
  { id: "chemistry", name: "Chemia", icon: "🧪" },
  { id: "biology", name: "Biologia", icon: "🧬" },
  { id: "physics", name: "Fizyka", icon: "⚛️" },
  { id: "polish", name: "Język Polski", icon: "📚" },
  { id: "english", name: "Język Angielski", icon: "🇬🇧" },
  { id: "german", name: "Język Niemiecki", icon: "🇩🇪" },
  { id: "spanish", name: "Język Hiszpański", icon: "🇪🇸" },
  { id: "russian", name: "Język Rosyjski", icon: "🇷🇺" },
]

const levels: Level[] = [
  { id: "basic", name: "Podstawowy", description: "Klasy 1-6" },
  { id: "intermediate", name: "Średni", description: "Klasy 7-9" },
  { id: "advanced", name: "Zaawansowany", description: "Liceum+" },
]

const generateMockSlots = (subjectId: string, levelId: string, weekStart: Date): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const days = 7

  for (let day = 0; day < days; day++) {
    const currentDate = new Date(weekStart)
    currentDate.setDate(currentDate.getDate() + day)

    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6

    if (isWeekend) {
      // Weekend: 09:00–14:00 (hours 9..13)
      for (let hour = 9; hour < 14; hour++) {
        const start = new Date(currentDate)
        start.setHours(hour, 0, 0, 0)
        const end = new Date(start)
        end.setHours(hour + 1, 0, 0, 0)

        slots.push({
          id: `slot_${subjectId}_${levelId}_${day}_${hour}`,
          type: "availability",
          subject_id: subjectId,
          level_id: levelId,
          start: start.toISOString(),
          end: end.toISOString(),
        })
      }
    } else {
      // Weekdays: 14:00–21:00 (hours 14..21)
      for (let hour = 14; hour < 22; hour++) {
        const start = new Date(currentDate)
        start.setHours(hour, 0, 0, 0)
        const end = new Date(start)
        end.setHours(hour + 1, 0, 0, 0)

        slots.push({
          id: `slot_${subjectId}_${levelId}_${day}_${hour}`,
          type: "availability",
          subject_id: subjectId,
          level_id: levelId,
          start: start.toISOString(),
          end: end.toISOString(),
        })
      }
    }
  }

  return slots
}

export function TutoringCalendar() {
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "day" | "list">("week")
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [showBookingSuccess, setShowBookingSuccess] = useState(false)
  const [bookingFormData, setBookingFormData] = useState<{
    childName: string
    parentName: string
    email: string
    phone: string
  }>({
    childName: "",
    parentName: "",
    email: "",
    phone: ""
  })

  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek])
  const weekEnd = useMemo(() => endOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek])

  useEffect(() => {
    if (selectedSubject && selectedLevel) {
      const mockSlots = generateMockSlots(selectedSubject, selectedLevel, weekStart)
      setSlots(mockSlots)
    } else {
      setSlots([])
    }
  }, [selectedSubject, selectedLevel, weekStart])

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId)
    setSelectedLevel("")
  }

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot)
  }

  const handleBooking = async (slot: TimeSlot, studentNote?: string) => {
    try {
      // Generuj unikalne ID rezerwacji
      const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Przygotuj dane do wysłania do webhooka
      const webhookData = WebhookService.createBookingData({
        reservationId,
        studentName: bookingFormData.childName || "Nie podano",
        parentName: bookingFormData.parentName || "Nie podano",
        email: bookingFormData.email || "niepodano@example.com",
        phone: bookingFormData.phone || "Nie podano",
        subject: selectedSubjectData || { id: selectedSubject, name: "Nieznany", icon: "❓" },
        level: selectedLevelData || { id: selectedLevel, name: "Nieznany", description: "" },
        startTime: slot.start,
        endTime: slot.end,
        note: studentNote,
        status: "confirmed"
      })

      // Wyślij dane do n8n webhook
      const webhookResult = await WebhookService.sendBookingData(webhookData)
      
      if (!webhookResult.success) {
        console.error('Błąd wysyłania do webhooka:', webhookResult.error)
        // Możesz dodać toast notification o błędzie
      }

      // Symuluj opóźnienie rezerwacji
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Aktualizuj stan UI
      setSlots((prevSlots) => {
        const updatedSlots = prevSlots.filter((s) => s.id !== slot.id)
        updatedSlots.push({
          ...slot,
          id: `lesson_${slot.id}`,
          type: "lesson",
          status: "confirmed",
          teacher_name: "Twoja lekcja",
        })
        return updatedSlots
      })

      setShowBookingSuccess(true)
    } catch (error) {
      console.error('Błąd podczas rezerwacji:', error)
      // Możesz dodać toast notification o błędzie
    }
  }

  const handleCloseDetailsPanel = () => {
    setSelectedSlot(null)
  }

  const handleFormDataChange = useCallback((data: {
    childName: string
    parentName: string
    email: string
    phone: string
  }) => {
    setBookingFormData(data)
  }, [])

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeek((prev) => (direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1)))
  }

  const selectedSubjectData = subjects.find((s) => s.id === selectedSubject)
  const selectedLevelData = levels.find((l) => l.id === selectedLevel)

  const sidebarWidth = "w-96"
  const sidebarTranslate = "translate-x-0"
  const mainShift = "ml-96"

  return (
    <div className="h-screen flex flex-col p-2 gap-1.5">
      {/* Fixed left sidebar for reservation details */}
      <div className={`fixed left-0 top-0 h-screen ${sidebarWidth} bg-background border-r shadow-xl z-40 transform transition-transform duration-300 ${sidebarTranslate}`}>
        <ReservationDetailsPanel
          isOpen={true}
          onClose={handleCloseDetailsPanel}
          slot={selectedSlot}
          subject={selectedSubjectData || null}
          level={selectedLevelData || null}
          onBook={handleBooking}
          onFormDataChange={handleFormDataChange}
        />
      </div>

      <Card className={`flex-shrink-0 ${mainShift} transition-[margin] duration-300`}>
        <CardContent className="p-2">
          <div className="flex flex-col gap-1.5">
            {/* Subject Selection - Ultra Compact */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-muted-foreground min-w-[56px]">Przedmiot:</span>
              <div className="flex gap-2 flex-wrap">
                {subjects.map((subject) => (
                  <Button
                    key={subject.id}
                    size="sm"
                    variant={selectedSubject === subject.id ? "default" : "outline"}
                    className="h-6 px-2"
                    onClick={() => handleSubjectChange(subject.id)}
                  >
                    <span className="mr-1">{subject.icon}</span>
                    <span className="text-xs">{subject.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Level Selection - Ultra Compact */}
            {selectedSubject && (
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-muted-foreground min-w-[56px]">Poziom:</span>
                <div className="flex flex-wrap gap-2">
                  {levels.map((level) => (
                    <label key={level.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                      <Checkbox
                        checked={selectedLevel === level.id}
                        onCheckedChange={() => {
                          setSelectedLevel(level.id)
                        }}
                      />
                      <span className="text-xs">{level.name} <span className="text-muted-foreground">({level.description})</span></span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedSubject && selectedLevel && (
        <div className={`flex-1 flex flex-col min-h-0 ${mainShift} transition-[margin] duration-300`}>
          {/* Calendar Header - Ultra Compact */}
          <Card className="flex-shrink-0 py-1">
            <CardContent className="py-[2px] px-2">
              <div className="flex items-center justify-between">
                {/* Data */}
                <span className="text-[11px] text-muted-foreground leading-none">
                  {format(weekStart, "d MMM")} - {format(weekEnd, "d MMM yyyy")}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* View Mode Toggle - Compact */}
                  <div className="flex rounded border p-0">
                    <Button
                      variant={viewMode === "week" ? "default" : "ghost"}
                      size="sm"
                      className="h-5 px-1"
                      onClick={() => setViewMode("week")}
                    >
                      <Calendar className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={viewMode === "day" ? "default" : "ghost"}
                      size="sm"
                      className="h-5 px-1"
                      onClick={() => setViewMode("day")}
                    >
                      <Clock className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      className="h-5 px-1"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Navigation - Compact */}
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-5 w-5 p-0" onClick={() => navigateWeek("prev")}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-5 px-2 text-[11px]" onClick={() => setCurrentWeek(new Date())}>
                      Dziś
                    </Button>
                    <Button variant="outline" size="sm" className="h-5 w-5 p-0" onClick={() => navigateWeek("next")}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Legend - Inline */}
                  <div className="flex items-center gap-1.5 text-[11px] py-0 leading-none">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded"></div>
                      <span>Dostępne</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded"></div>
                      <span>Zarezerwowane</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-300 rounded"></div>
                      <span>Niedostępne</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 min-h-0 mt-0.5">
            <CalendarView slots={slots} viewMode={viewMode} currentWeek={currentWeek} onSlotClick={handleSlotClick} />
          </div>
        </div>
      )}

      {/* Booking success dialog */}
      <Dialog open={showBookingSuccess} onOpenChange={setShowBookingSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Rezerwacja potwierdzona
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Twoja lekcja została zarezerwowana. Szczegóły wysłaliśmy na e-mail.
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowBookingSuccess(false)}>Zamknij</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Usunięto wcześniejszy panel na dole komponentu */}
    </div>
  )
}
