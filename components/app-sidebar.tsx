"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconCalendar,
  IconCash,
  IconDashboard,
  IconInnerShadowTop,
  IconUser,
  IconUsers,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSupabaseUser } from "@/hooks/use-supabase-user"
import { useProfile } from "@/hooks/use-profile"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { Tutor } from "@/types"

// Menu dla admina
const adminNavMain = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: IconDashboard,
  },
  {
    title: "Uczniowie",
    url: "/admin/uczniowie",
    icon: IconUsers,
  },
  {
    title: "Korepetytorzy",
    url: "/admin/korepetytorzy",
    icon: IconUser,
  },
]

// Menu dla tutora
const tutorNavMain = [
  {
    title: "Dashboard",
    url: "/tutor",
    icon: IconDashboard,
  },
  {
    title: "Uczniowie",
    url: "/tutor/uczniowie",
    icon: IconUsers,
  },
  {
    title: "Kalendarz",
    url: "/tutor/kalendarz",
    icon: IconCalendar,
  },
  {
    title: "Rozliczenia",
    url: "/tutor/rozliczenia",
    icon: IconCash,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: authUser, loading: userLoading } = useSupabaseUser()
  const { profile, loading: profileLoading } = useProfile()
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [tutorLoading, setTutorLoading] = useState(false)
  const supabase = createClient()

  // Pobierz dane tutora jeśli użytkownik ma rolę tutor
  useEffect(() => {
    const fetchTutor = async () => {
      if (!profile || profile.role !== 'tutor') {
        setTutor(null)
        return
      }

      setTutorLoading(true)
      try {
        const { data, error } = await supabase
          .from('tutors')
          .select('*')
          .eq('profile_id', profile.id)
          .single()

        if (!error && data) {
          setTutor(data)
        }
      } catch (err) {
        console.error('Błąd podczas pobierania danych tutora:', err)
      } finally {
        setTutorLoading(false)
      }
    }

    fetchTutor()
  }, [profile, supabase])

  // Przygotuj dane użytkownika do wyświetlenia
  const userData = React.useMemo(() => {
    if (!authUser) {
      return {
        name: "Ładowanie...",
        email: "",
        avatar: "",
      }
    }

    // Jeśli użytkownik jest tutorem i mamy jego dane
    if (tutor) {
      return {
        name: `${tutor.first_name} ${tutor.last_name}`,
        email: authUser.email || tutor.email || "",
        avatar: "",
      }
    }

    // Fallback - użyj danych z auth
    const displayName = authUser.user_metadata?.full_name || 
                        authUser.user_metadata?.name || 
                        authUser.email?.split('@')[0] || 
                        "Użytkownik"

    return {
      name: displayName,
      email: authUser.email || "",
      avatar: authUser.user_metadata?.avatar_url || "",
    }
  }, [authUser, tutor])

  const isLoading = userLoading || profileLoading || tutorLoading

  // Wybierz odpowiednie menu na podstawie roli użytkownika
  const navMain = React.useMemo(() => {
    if (!profile) return tutorNavMain // Domyślnie tutor
    return profile.role === 'admin' ? adminNavMain : tutorNavMain
  }, [profile])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Akademia Wiedzy</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        {!isLoading && <NavUser user={userData} />}
      </SidebarFooter>
    </Sidebar>
  )
}
