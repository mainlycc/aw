# Specyfikacja Techniczna Projektu CLI_AW

## 1. Stack Technologiczny

### 1.1 Frontend
- **Framework**: Next.js 15+ (App Router)
- **Język**: TypeScript
- **Stylowanie**: Tailwind CSS
- **Komponenty UI**: shadcn/ui
- **Zarządzanie stanem**: React Hooks + Context API
- **Formularze**: React Hook Form (z integracją shadcn/ui)
- **Walidacja**: Zod

### 1.2 Backend & Baza Danych
- **Backend as a Service**: Supabase
- **Baza danych**: PostgreSQL (przez Supabase)
- **Autoryzacja**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### 1.3 Narzędzia Deweloperskie
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Type Checking**: TypeScript

## 2. Architektura Aplikacji

### 2.1 Struktura Folderów
```
aw/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Layout główny (sidebar + header)
│   ├── page.tsx                 # Strona główna
│   ├── login/
│   │   └── page.tsx            # Strona logowania
│   ├── dashboard/
│   │   ├── page.tsx            # Dashboard główny
│   │   └── [subpage]/          # Podstrony dashboard
│   └── [inne-zakładki]/        # Kolejne zakładki aplikacji
│
├── components/                   # Komponenty React
│   ├── ui/                      # Komponenty shadcn/ui
│   ├── app-sidebar.tsx          # Sidebar aplikacji
│   ├── site-header.tsx          # Header aplikacji
│   └── [inne-komponenty].tsx   # Komponenty biznesowe
│
├── lib/                         # Biblioteki i utilities
│   ├── supabase/
│   │   ├── client.ts           # Klient Supabase (browser)
│   │   ├── server.ts           # Klient Supabase (server)
│   │   └── middleware.ts       # Middleware dla auth
│   ├── utils.ts                # Utility functions
│   └── validations/            # Schematy walidacji Zod
│
├── hooks/                       # Custom React Hooks
│   ├── use-mobile.ts
│   └── use-supabase-user.ts    # Hook do zarządzania użytkownikiem
│
├── types/                       # TypeScript types & interfaces
│   ├── database.types.ts       # Typy wygenerowane z Supabase
│   └── index.ts                # Eksport typów
│
└── public/                      # Pliki statyczne
```

### 2.2 Routing i Nawigacja
- **App Router**: Wykorzystanie Next.js 15 App Router
- **Middleware**: Ochrona ścieżek wymagających autoryzacji
- **Layout Persystentny**: Sidebar i header na wszystkich stronach (oprócz login)

## 3. Supabase - Konfiguracja i Użycie

### 3.1 Instalacja
```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### 3.2 Zmienne Środowiskowe
Plik `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3.3 Konfiguracja Klienta

#### Browser Client (`lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### Server Client (`lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### 3.4 Middleware dla Autoryzacji
Plik `middleware.ts` w katalogu głównym:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Przekieruj niezalogowanych użytkowników
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Przekieruj zalogowanych z /login
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

## 4. Funkcjonalności Supabase

### 4.1 Autoryzacja (Supabase Auth)

#### Metody Logowania
- Email & Password
- OAuth (Google, GitHub, etc.) - opcjonalnie
- Magic Link - opcjonalnie

#### Operacje Auth
```typescript
// Logowanie
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Rejestracja
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Wylogowanie
const { error } = await supabase.auth.signOut()

// Pobierz aktualnego użytkownika
const { data: { user } } = await supabase.auth.getUser()

// Reset hasła
const { error } = await supabase.auth.resetPasswordForEmail('user@example.com')
```

### 4.2 Baza Danych (PostgreSQL)

#### Row Level Security (RLS)
- Włącz RLS na wszystkich tabelach
- Definiuj polityki dostępu per tabela
- Użytkownicy mają dostęp tylko do swoich danych

#### Przykładowe Tabele
```sql
-- Profil użytkownika
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Przykładowa tabela danych
CREATE TABLE user_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Użytkownik widzi tylko swoje dane
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can view own data" 
  ON user_data FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" 
  ON user_data FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" 
  ON user_data FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" 
  ON user_data FOR DELETE 
  USING (auth.uid() = user_id);
```

#### Operacje na Bazie
```typescript
// SELECT
const { data, error } = await supabase
  .from('user_data')
  .select('*')
  .eq('user_id', userId)

// INSERT
const { data, error } = await supabase
  .from('user_data')
  .insert({ user_id: userId, title: 'Tytuł', content: 'Treść' })

// UPDATE
const { data, error } = await supabase
  .from('user_data')
  .update({ title: 'Nowy tytuł' })
  .eq('id', itemId)

// DELETE
const { data, error } = await supabase
  .from('user_data')
  .delete()
  .eq('id', itemId)

// Real-time subscription
const channel = supabase
  .channel('user_data_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'user_data' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

### 4.3 Storage (Przechowywanie Plików)

#### Bucket Configuration
- Publiczne buckety dla zasobów dostępnych publicznie
- Prywatne buckety z RLS dla plików użytkowników

```typescript
// Upload pliku
const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file)

// Pobierz publiczny URL
const { data } = supabase
  .storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`)

// Usuń plik
const { error } = await supabase
  .storage
  .from('avatars')
  .remove([`${userId}/avatar.png`])
```

### 4.4 Real-time
- Subskrypcje do zmian w bazie danych
- Synchronizacja danych w czasie rzeczywistym
- Powiadomienia o zmianach

## 5. Bezpieczeństwo

### 5.1 Zasady Bezpieczeństwa
- ✅ Wszystkie tabele z włączonym RLS
- ✅ Walidacja danych po stronie klienta (Zod) i serwera (PostgreSQL constraints)
- ✅ Używaj Server Components dla wrażliwych operacji
- ✅ Nigdy nie przechowuj secrets w kodzie źródłowym
- ✅ Używaj zmiennych środowiskowych (.env.local)
- ✅ Sanityzacja inputów użytkownika

### 5.2 Environment Variables
```env
# .env.local (nie commituj do git!)
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# .env.example (commituj do git)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 6. Generowanie Typów

### 6.1 TypeScript Types z Supabase
Wygeneruj typy TypeScript z schemy bazy danych:

```bash
# Zainstaluj Supabase CLI globalnie (opcjonalnie)
npm install -g supabase

# Logowanie do Supabase
supabase login

# Generowanie typów
supabase gen types typescript --project-id your_project_id > types/database.types.ts
```

### 6.2 Użycie Typów
```typescript
import { Database } from '@/types/database.types'

// Używaj typów w aplikacji
type Profile = Database['public']['Tables']['profiles']['Row']
type UserData = Database['public']['Tables']['user_data']['Row']

// Typowany klient Supabase
const supabase = createClient<Database>()
```

## 7. Schemat Przepływu Danych

```
User Action (Browser)
    ↓
React Component
    ↓
Validation (Zod)
    ↓
Supabase Client (lib/supabase/client.ts)
    ↓
Supabase Backend
    ↓
PostgreSQL Database (RLS check)
    ↓
Response
    ↓
React Component Update
    ↓
UI Refresh
```

## 8. Deployment

### 8.1 Vercel (Rekomendowane dla Next.js)
- Automatyczne deploymenty z GitHub
- Environment variables w dashboard Vercel
- Edge Functions dla middleware

### 8.2 Supabase Dashboard
- Zarządzanie tabelami
- SQL Editor
- Auth settings
- Storage buckets
- Database backups

## 9. Testowanie

### 9.1 Testowanie Lokalne
- Używaj Supabase Local Development (opcjonalnie)
- Testuj na development project w Supabase

### 9.2 Environment Separation
- **Development**: Osobny projekt Supabase
- **Production**: Produkcyjny projekt Supabase

## 10. Monitoring i Analytics

### 10.1 Supabase Dashboard
- Monitoruj użycie API
- Sprawdzaj logi
- Analizuj wydajność zapytań

### 10.2 Error Handling
```typescript
// Zawsze obsługuj błędy
const { data, error } = await supabase.from('table').select()

if (error) {
  console.error('Database error:', error)
  // Wyświetl toast notification (sonner)
  toast.error('Wystąpił błąd podczas ładowania danych')
  return
}

// Użyj danych
console.log(data)
```

---

## 📋 Checklist Implementacji

### Konfiguracja Początkowa
- [ ] Zainstaluj pakiety Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- [ ] Utwórz projekt w Supabase Dashboard
- [ ] Skonfiguruj zmienne środowiskowe (.env.local)
- [ ] Stwórz klientów Supabase (client.ts, server.ts)
- [ ] Skonfiguruj middleware.ts

### Baza Danych
- [ ] Zaprojektuj schemat bazy danych
- [ ] Utwórz tabele w Supabase
- [ ] Włącz RLS na wszystkich tabelach
- [ ] Zdefiniuj polityki RLS
- [ ] Wygeneruj typy TypeScript

### Autoryzacja
- [ ] Skonfiguruj Supabase Auth
- [ ] Zaimplementuj stronę logowania
- [ ] Zaimplementuj rejestrację (opcjonalnie)
- [ ] Dodaj obsługę sesji
- [ ] Zaimplementuj wylogowanie

### Integracja
- [ ] Stwórz custom hooks dla Supabase
- [ ] Zaimplementuj obsługę błędów
- [ ] Dodaj loading states
- [ ] Przetestuj przepływ auth
- [ ] Przetestuj operacje CRUD

---

*Dokument utworzony: 6 października 2025*

