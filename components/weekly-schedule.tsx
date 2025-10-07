"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ScheduleSlot {
  id: string
  time: string
  student?: string
  grade?: string
  status: 'available' | 'booked' | 'unavailable'
}

interface WeeklyScheduleProps {
  tutorName: string
}

const DAYS = [
  { key: 'monday', label: 'Poniedziałek', short: 'Pon' },
  { key: 'tuesday', label: 'Wtorek', short: 'Wt' },
  { key: 'wednesday', label: 'Środa', short: 'Śr' },
  { key: 'thursday', label: 'Czwartek', short: 'Czw' },
  { key: 'friday', label: 'Piątek', short: 'Pt' },
  { key: 'saturday', label: 'Sobota', short: 'Sob' },
  { key: 'sunday', label: 'Niedziela', short: 'Nd' }
]

// Godziny dla dni roboczych (pon-pt)
const WEEKDAY_HOURS = [
  '15-16', '16-17', '17-18', '18-19', '19-20', '20-21'
]

// Godziny dla weekendu (sob-nd)
const WEEKEND_HOURS = [
  '10-11', '11-12', '12-13', '13-14', '14-15', '15-16', '16-17', '17-18', '18-19', '19-20'
]

export function WeeklySchedule({ tutorName }: WeeklyScheduleProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [editingSlot, setEditingSlot] = useState<{
    day: string
    hour: string
    slot?: ScheduleSlot
  } | null>(null)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  // Przykładowe dane harmonogramu (w rzeczywistej aplikacji będą pobierane z bazy danych)
  const [scheduleData, setScheduleData] = useState<Record<string, ScheduleSlot[]>>({
    monday: [
      { id: '1', time: '15-16', status: 'available' },
      { id: '2', time: '16-17', status: 'available' },
      { id: '3', time: '17-18', student: 'Julia Krawczyk', grade: '5', status: 'booked' },
      { id: '4', time: '18-19', status: 'available' },
      { id: '5', time: '19-20', student: 'Bartosz', grade: '8kl', status: 'booked' },
      { id: '6', time: '20-21', status: 'available' }
    ],
    tuesday: [
      { id: '7', time: '15-16', status: 'unavailable' },
      { id: '8', time: '16-17', status: 'unavailable' },
      { id: '9', time: '17-18', status: 'unavailable' },
      { id: '10', time: '18-19', status: 'unavailable' },
      { id: '11', time: '19-20', status: 'unavailable' },
      { id: '12', time: '20-21', status: 'unavailable' }
    ],
    wednesday: [
      { id: '13', time: '15-16', status: 'available' },
      { id: '14', time: '16-17', student: 'Julia Tworek', grade: '7kl', status: 'booked' },
      { id: '15', time: '17-18', status: 'available' },
      { id: '16', time: '18-19', status: 'available' },
      { id: '17', time: '19-20', student: 'Szymon', grade: '8kl', status: 'booked' },
      { id: '18', time: '20-21', status: 'available' }
    ],
    thursday: [
      { id: '19', time: '15-16', status: 'unavailable' },
      { id: '20', time: '16-17', status: 'unavailable' },
      { id: '21', time: '17-18', status: 'unavailable' },
      { id: '22', time: '18-19', status: 'unavailable' },
      { id: '23', time: '19-20', status: 'unavailable' },
      { id: '24', time: '20-21', status: 'unavailable' }
    ],
    friday: [
      { id: '25', time: '15-16', status: 'available' },
      { id: '26', time: '16-17', student: 'Julia', grade: '8kl', status: 'booked' },
      { id: '27', time: '17-18', status: 'available' },
      { id: '28', time: '18-19', status: 'available' },
      { id: '29', time: '19-20', status: 'available' },
      { id: '30', time: '20-21', student: 'Ola', grade: '8kl', status: 'booked' }
    ],
    saturday: [
      { id: '31', time: '10-11', status: 'unavailable' },
      { id: '32', time: '11-12', status: 'unavailable' },
      { id: '33', time: '12-13', status: 'unavailable' },
      { id: '34', time: '13-14', status: 'unavailable' },
      { id: '35', time: '14-15', student: 'Filip', grade: '8kl', status: 'booked' },
      { id: '36', time: '15-16', status: 'available' },
      { id: '37', time: '16-17', status: 'available' },
      { id: '38', time: '17-18', status: 'unavailable' },
      { id: '39', time: '18-19', status: 'available' },
      { id: '40', time: '19-20', status: 'available' }
    ],
    sunday: [
      { id: '41', time: '10-11', status: 'unavailable' },
      { id: '42', time: '11-12', status: 'unavailable' },
      { id: '43', time: '12-13', status: 'unavailable' },
      { id: '44', time: '13-14', status: 'available' },
      { id: '45', time: '14-15', status: 'available' },
      { id: '46', time: '15-16', status: 'available' },
      { id: '47', time: '16-17', status: 'available' },
      { id: '48', time: '17-18', status: 'available' },
      { id: '49', time: '18-19', status: 'available' },
      { id: '50', time: '19-20', status: 'available' }
    ]
  })

  const handleSlotClick = (day: string, hour: string) => {
    const daySchedule = scheduleData[day] || []
    const slot = daySchedule.find(s => s.time === hour)
    
    setEditingSlot({
      day,
      hour,
      slot: slot || { id: `${day}-${hour}`, time: hour, status: 'available' }
    })
    setIsPopoverOpen(true)
  }

  const handleSlotUpdate = (newStatus: 'available' | 'booked' | 'unavailable', student?: string, grade?: string) => {
    if (!editingSlot) return

    const { day, hour } = editingSlot
    const newSlot: ScheduleSlot = {
      id: editingSlot.slot?.id || `${day}-${hour}`,
      time: hour,
      status: newStatus,
      student: newStatus === 'booked' ? student : undefined,
      grade: newStatus === 'booked' ? grade : undefined
    }

    setScheduleData(prev => ({
      ...prev,
      [day]: prev[day] ? 
        prev[day].map(s => s.time === hour ? newSlot : s) :
        [newSlot]
    }))

    setIsPopoverOpen(false)
    setEditingSlot(null)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const formatWeekRange = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday
    start.setDate(diff)
    
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    
    return `${start.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Harmonogram tygodniowy - {tutorName}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {formatWeekRange(currentWeek)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Nagłówki dni */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="p-2 text-sm font-medium text-center">Godz.</div>
              {DAYS.map((day) => (
                <div key={day.key} className="p-2 text-sm font-medium text-center bg-gray-50 rounded">
                  {day.short}
                </div>
              ))}
            </div>

            {/* Harmonogram */}
            <div className="space-y-1">
              {/* Wszystkie godziny w jednym wierszu */}
              {(() => {
                // Pobierz wszystkie unikalne godziny
                const allHours = [...new Set([
                  ...WEEKDAY_HOURS,
                  ...WEEKEND_HOURS
                ])].sort()
                
                return allHours.map((hour) => (
                  <div key={hour} className="grid grid-cols-8 gap-1">
                    {/* Kolumna z godziną */}
                    <div className="p-2 text-xs text-center bg-gray-50 rounded h-12 flex items-center justify-center">
                      {hour}
                    </div>
                    
                    {/* Kolumny dla każdego dnia */}
                    {DAYS.map((day) => {
                      const daySchedule = scheduleData[day.key] || []
                      const slot = daySchedule.find(s => s.time === hour)
                      const status = slot?.status || 'available'
                      const isBooked = status === 'booked'
                      const isUnavailable = status === 'unavailable'
                      
                      return (
                        <Popover 
                          key={`${day.key}-${hour}`}
                          open={editingSlot?.day === day.key && editingSlot?.hour === hour && isPopoverOpen}
                          onOpenChange={(open) => {
                            if (!open) {
                              setIsPopoverOpen(false)
                              setEditingSlot(null)
                            } else {
                              handleSlotClick(day.key, hour)
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <div
                              className={`
                                h-12 rounded text-xs p-1 flex items-center justify-center text-center cursor-pointer hover:opacity-80 transition-opacity relative group
                                ${isBooked ? 'bg-green-500 text-white' : 
                                  isUnavailable ? 'bg-gray-800 text-white' : 
                                  'bg-green-100 text-green-800 border border-green-300'}
                              `}
                            >
                              {isBooked && slot?.student ? (
                                <div className="text-center">
                                  <div className="font-medium">{slot.student}</div>
                                  <div className="text-xs opacity-90">{slot.grade}</div>
                                </div>
                              ) : isUnavailable ? (
                                <span className="text-xs">Niedostępny</span>
                              ) : (
                                <span className="text-xs">wolne</span>
                              )}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <EditSlotPopover 
                              slot={slot}
                              day={day.label}
                              hour={hour}
                              onUpdate={handleSlotUpdate}
                              onClose={() => {
                                setIsPopoverOpen(false)
                                setEditingSlot(null)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      )
                    })}
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-6 flex justify-end">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-800 rounded"></div>
              <span>Niedostępny/a</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>wolne</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Zajęte</span>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}

// Komponent popover edycji slotu
function EditSlotPopover({ 
  slot, 
  day,
  hour,
  onUpdate, 
  onClose 
}: { 
  slot?: ScheduleSlot
  day: string
  hour: string
  onUpdate: (status: 'available' | 'booked' | 'unavailable', student?: string, grade?: string) => void
  onClose: () => void
}) {
  const [status, setStatus] = useState<'available' | 'booked' | 'unavailable'>(slot?.status || 'available')
  const [student, setStudent] = useState(slot?.student || '')
  const [grade, setGrade] = useState(slot?.grade || '')

  const handleSave = () => {
    onUpdate(status, student, grade)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium text-sm">
          Edytuj slot - {day} {hour}
        </h4>
      </div>
      
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(value: 'available' | 'booked' | 'unavailable') => setStatus(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Wolne</SelectItem>
            <SelectItem value="booked">Zajęte (lekcja)</SelectItem>
            <SelectItem value="unavailable">Niedostępny</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {status === 'booked' && (
        <>
          <div className="space-y-2">
            <Label>Uczeń</Label>
            <Input 
              value={student} 
              onChange={(e) => setStudent(e.target.value)}
              placeholder="Imię ucznia"
            />
          </div>
          <div className="space-y-2">
            <Label>Klasa</Label>
            <Input 
              value={grade} 
              onChange={(e) => setGrade(e.target.value)}
              placeholder="np. 5, 8kl, 1lo"
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} size="sm">
          Anuluj
        </Button>
        <Button onClick={handleSave} size="sm">
          Zapisz
        </Button>
      </div>
    </div>
  )
}
