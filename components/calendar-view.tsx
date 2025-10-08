"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { TimeSlot } from "@/components/tutoring-calendar"
import { format, startOfWeek, addDays, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"

interface CalendarViewProps {
  slots: TimeSlot[]
  viewMode: "week" | "day" | "list"
  currentWeek: Date
  onSlotClick: (slot: TimeSlot) => void
}

const timeSlots = Array.from({ length: 15 }, (_, i) => i + 8) // 8:00 - 22:00

export function CalendarView({ slots, viewMode, currentWeek, onSlotClick }: CalendarViewProps) {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const plWeekdayShort = (d: Date) => new Intl.DateTimeFormat('pl-PL', { weekday: 'short' }).format(d)
  const plMonthShort = (d: Date) => new Intl.DateTimeFormat('pl-PL', { month: 'short' }).format(d)
  const plFullDate = (d: Date) => new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d)
  const plFullDateNoYear = (d: Date) => new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)

  const getSlotColor = (slot: TimeSlot) => {
    if (slot.type === "availability") {
      return "bg-green-700 text-white hover:bg-green-600"
    } else if (slot.type === "lesson") {
      if (slot.status === "confirmed") {
        return "bg-booked text-booked-foreground"
      } else if (slot.status === "pending") {
        return "bg-pending text-pending-foreground"
      }
    }
    return "bg-unavailable text-unavailable-foreground"
  }

  const getHourLabel = (slot: TimeSlot) => {
    const h = new Date(slot.start).getHours()
    return h.toString()
  }

  const getSlotsForDayAndHour = (day: Date, hour: number) => {
    return slots.filter((slot) => {
      const slotDate = new Date(slot.start)
      return isSameDay(slotDate, day) && slotDate.getHours() === hour
    })
  }

  if (viewMode === "list") {
    const availableSlots = slots
      .filter((slot) => slot.type === "availability")
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 20) // Show next 20 available slots

    return (
      <Card>
        <CardContent className="p-3">
          <h3 className="text-sm font-semibold mb-2">Najbliższe dostępne terminy</h3>
          <div className="space-y-2">
            {availableSlots.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-sm">Brak dostępnych terminów w tym okresie</p>
            ) : (
              availableSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => onSlotClick(slot)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xs">
                      <div className="font-medium">{plFullDateNoYear(new Date(slot.start))}</div>
                      <div className="text-muted-foreground">
                        {format(new Date(slot.start), "HH:mm")} - {format(new Date(slot.end), "HH:mm")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="h-7 px-2 text-xs">Zarezerwuj</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "day") {
    const currentDay = weekStart // For simplicity, show Monday

    return (
      <Card>
        <CardContent className="p-3">
          <h3 className="text-sm font-semibold mb-2">{plFullDate(new Date(currentDay))}</h3>
          <div className="space-y-1">
            {timeSlots.map((hour) => {
              const hourSlots = getSlotsForDayAndHour(currentDay, hour)
              return (
                <div key={hour} className="flex items-center gap-3 py-1.5">
                  <div className="w-14 text-xs text-muted-foreground">{hour.toString().padStart(2, "0")}:00</div>
                  <div className="flex-1">
                    {hourSlots.length > 0 ? (
                      <div className="flex gap-1.5">
                        {hourSlots.map((slot) => (
                          <Button
                            key={slot.id}
                            variant="outline"
                            size="sm"
                            className={cn("h-7 text-xs px-2", getSlotColor(slot))}
                            onClick={() => onSlotClick(slot)}
                          >
                            {getHourLabel(slot)}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="h-6 bg-unavailable/20 rounded border-2 border-dashed border-unavailable/40" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Week view
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 border-b">
              <div className="p-3 border-r bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Godzina</span>
              </div>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-3 border-r text-center",
                    isSameDay(day, new Date()) && "bg-muted/50"
                  )}
                >
                  <div className="text-xs font-medium">{plWeekdayShort(day)}</div>
                  <div className="text-base font-semibold">{new Intl.DateTimeFormat('pl-PL', { day: 'numeric' }).format(day)}</div>
                  <div className="text-[11px] text-muted-foreground">{plMonthShort(day)}</div>
                </div>
              ))}
            </div>

            {/* Time slots grid */}
            <div className="divide-y">
              {timeSlots.map((hour) => (
                <div key={hour} className="grid grid-cols-8 min-h-[44px]">
                  <div className="p-3 border-r bg-muted/30 flex items-center">
                    <span className="text-xs text-muted-foreground">{hour.toString().padStart(2, "0")}:00</span>
                  </div>
                  {weekDays.map((day) => {
                    const daySlots = getSlotsForDayAndHour(day, hour)
                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className={cn(
                          "border-r p-1.5",
                          isSameDay(day, new Date()) && "bg-muted/30"
                        )}
                      >
                        {daySlots.length > 0 ? (
                          <div className="space-y-1">
                            {daySlots.map((slot) => (
                              <Button
                                key={slot.id}
                                variant="outline"
                                size="sm"
                                className={cn("w-full text-[11px] h-7 px-2", getSlotColor(slot))}
                                onClick={() => onSlotClick(slot)}
                              >
                                {slot.type === "availability" ? (
                                  <>
                                    {getHourLabel(slot)}
                                  </>
                                ) : (
                                  "Twoja lekcja"
                                )}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          // Weekend or unavailable time
                          (day.getDay() === 0 || day.getDay() === 6 || hour < 14 || hour >= 22) && (
                            <div className="w-full h-7 bg-unavailable/10 rounded border border-dashed border-unavailable/30" />
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
