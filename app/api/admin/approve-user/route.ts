import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Profile, TutorInsert } from '@/types'

export async function POST(request: Request) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId i role są wymagane' },
        { status: 400 }
      )
    }

    if (role !== 'tutor' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Nieprawidłowa rola. Dozwolone: tutor, admin' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sprawdź czy użytkownik jest adminem
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Nie jesteś zalogowany' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<Pick<Profile, 'role'>>()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    // Zaktualizuj rolę użytkownika
    const { error: updateError } = await (supabase
      .from('profiles') as any)
      .update({ role })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return NextResponse.json(
        { error: 'Błąd przy aktualizacji roli użytkownika' },
        { status: 500 }
      )
    }

    // Jeśli rola to 'tutor', utwórz rekord w tabeli tutors
    if (role === 'tutor') {
      // Pobierz email użytkownika
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single<Pick<Profile, 'email'>>()

      const { data: { user: userData } } = await supabase.auth.admin.getUserById(userId)
      
      const fullName = userData?.user_metadata?.full_name || 'Nowy Korepetytory'
      const [firstName, ...lastNameParts] = fullName.split(' ')
      const lastName = lastNameParts.join(' ') || firstName

      const tutorData: TutorInsert = {
        profile_id: userId,
        first_name: firstName,
        last_name: lastName,
        email: userProfile?.email || null,
        active: true,
      }
      
      const { error: tutorError } = await (supabase
        .from('tutors') as any)
        .insert(tutorData)

      if (tutorError) {
        console.error('Error creating tutor record:', tutorError)
        // Nie zwracamy błędu, bo rola została zaktualizowana
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in approve-user endpoint:', error)
    return NextResponse.json(
      { error: 'Wewnętrzny błąd serwera' },
      { status: 500 }
    )
  }
}

