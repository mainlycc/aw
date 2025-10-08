'use client'

import * as React from "react"
import { useState } from "react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconCheck, IconX, IconUserCheck } from "@tabler/icons-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PendingUser {
  id: string
  email: string
  created_at: string
}

interface PendingUsersDataTableProps {
  initialUsers: PendingUser[]
}

export function PendingUsersDataTable({ initialUsers }: PendingUsersDataTableProps) {
  const [users, setUsers] = useState<PendingUser[]>(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const handleApprove = async (userId: string) => {
    setLoading(userId)
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: 'tutor' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd przy zatwierdzaniu użytkownika')
      }

      toast.success('Użytkownik został zatwierdzony', {
        description: 'Może się teraz zalogować jako korepetytory',
      })
      
      // Usuń użytkownika z listy
      setUsers(users.filter(u => u.id !== userId))
      setShowApproveDialog(false)
    } catch (error: any) {
      toast.error('Błąd', {
        description: error.message || 'Nie udało się zatwierdzić użytkownika',
      })
    } finally {
      setLoading(null)
      setSelectedUserId(null)
    }
  }

  const handleReject = async (userId: string) => {
    setLoading(userId)
    try {
      const response = await fetch('/api/admin/reject-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Błąd przy odrzucaniu użytkownika')
      }

      toast.success('Użytkownik został odrzucony', {
        description: 'Konto zostało usunięte',
      })
      
      // Usuń użytkownika z listy
      setUsers(users.filter(u => u.id !== userId))
      setShowRejectDialog(false)
    } catch (error: any) {
      toast.error('Błąd', {
        description: error.message || 'Nie udało się odrzucić użytkownika',
      })
    } finally {
      setLoading(null)
      setSelectedUserId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pl-PL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <IconUserCheck className="size-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Brak oczekujących użytkowników</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Wszyscy użytkownicy zostali zatwierdzeni lub odrzuceni
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Data rejestracji</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">Oczekuje</Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={loading === user.id}
                    onClick={() => {
                      setSelectedUserId(user.id)
                      setShowApproveDialog(true)
                    }}
                  >
                    <IconCheck className="size-4 mr-1" />
                    Zatwierdź
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={loading === user.id}
                    onClick={() => {
                      setSelectedUserId(user.id)
                      setShowRejectDialog(true)
                    }}
                  >
                    <IconX className="size-4 mr-1" />
                    Odrzuć
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog zatwierdzania */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zatwierdź użytkownika</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz zatwierdzić tego użytkownika? 
              Otrzyma on rolę korepetytora i będzie mógł się zalogować do aplikacji.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false)
                setSelectedUserId(null)
              }}
            >
              Anuluj
            </Button>
            <Button
              onClick={() => selectedUserId && handleApprove(selectedUserId)}
              disabled={!selectedUserId || loading === selectedUserId}
            >
              Zatwierdź
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog odrzucania */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Odrzuć użytkownika</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz odrzucić tego użytkownika? 
              Jego konto zostanie trwale usunięte.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setSelectedUserId(null)
              }}
            >
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedUserId && handleReject(selectedUserId)}
              disabled={!selectedUserId || loading === selectedUserId}
            >
              Odrzuć
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function PendingUsersDataTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Data rejestracji</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-9 w-32 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

