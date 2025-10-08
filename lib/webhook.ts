import { Subject, Level } from "@/components/tutoring-calendar"

export interface BookingData {
  reservationId: string
  studentName: string
  parentName: string
  email: string
  phone: string
  subject: Subject
  level: Level
  startTime: string
  endTime: string
  note?: string
  status: string
}

export interface WebhookPayload {
  reservationId: string
  studentName: string
  parentName: string
  email: string
  phone: string
  subject: string
  subjectIcon: string
  level: string
  levelDescription: string
  startTime: string
  endTime: string
  note?: string
  status: string
  timestamp: string
}

export interface WebhookResponse {
  success: boolean
  error?: string
}

export class WebhookService {
  // URL webhooka n8n (możesz to zmienić na zmienną środowiskową)
  private static WEBHOOK_URL = process.env.NEXT_PUBLIC_WEBHOOK_URL || ""

  /**
   * Tworzy dane rezerwacji w formacie odpowiednim dla webhooka
   */
  static createBookingData(data: BookingData): WebhookPayload {
    return {
      reservationId: data.reservationId,
      studentName: data.studentName,
      parentName: data.parentName,
      email: data.email,
      phone: data.phone,
      subject: data.subject.name,
      subjectIcon: data.subject.icon,
      level: data.level.name,
      levelDescription: data.level.description,
      startTime: data.startTime,
      endTime: data.endTime,
      note: data.note,
      status: data.status,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Wysyła dane rezerwacji do webhooka n8n
   */
  static async sendBookingData(data: WebhookPayload): Promise<WebhookResponse> {
    // Jeśli URL webhooka nie jest skonfigurowany, zwróć sukces bez wysyłania
    if (!this.WEBHOOK_URL) {
      console.warn('WEBHOOK_URL nie jest skonfigurowany. Dane rezerwacji nie zostaną wysłane.')
      return { success: true }
    }

    try {
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return { success: true }
    } catch (error) {
      console.error('Błąd wysyłania danych do webhooka:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Nieznany błąd',
      }
    }
  }
}

