import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/supabase/queries"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { PageTitleWrapper } from "@/components/page-title-wrapper"

/**
 * Layout dla panelu tutora
 * Sprawdza czy użytkownik ma rolę 'tutor' i wyświetla sidebar + header
 */
export default async function TutorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await getProfile(supabase, user.id)
  if (!data) redirect('/login')
  
  // TypeScript ma problem z control flow po redirect() - używamy workaround
  // @ts-expect-error - redirect() throws but TS doesn't recognize it properly
  const userRole = data?.role
  if (userRole === 'admin') redirect('/admin')
  if (userRole !== 'tutor') redirect('/login')

  return (
    <PageTitleWrapper>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </PageTitleWrapper>
  )
}
