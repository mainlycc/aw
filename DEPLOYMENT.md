# Deployment Guide - Akademia Wiedzy (CLI_AW)

Kompletny przewodnik po deploymencie aplikacji Akademia Wiedzy na platformie Vercel.

## 📋 Wymagania wstępne

1. **Konto Vercel** - [Zarejestruj się](https://vercel.com/signup) jeśli jeszcze nie masz konta
2. **Konto Supabase** - [Utwórz projekt](https://app.supabase.com/)
3. **Git repository** - Aplikacja musi być w repozytorium Git (GitHub, GitLab, Bitbucket)

## 🗄️ Krok 1: Konfiguracja bazy danych Supabase

### 1.1 Utwórz projekt Supabase

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com/)
2. Kliknij "New Project"
3. Wybierz organizację i nazwij projekt (np. "akademia-wiedzy")
4. Wybierz region (najlepiej Europe - Frankfurt)
5. Ustaw silne hasło do bazy danych
6. Kliknij "Create new project"

### 1.2 Uruchom skrypty SQL

W kolejności uruchom następujące pliki SQL w Supabase SQL Editor:

1. **Schemat bazy danych**:
   ```sql
   -- Skopiuj zawartość pliku: ../database.sql
   ```

2. **RLS Policies**:
   ```sql
   -- Skopiuj zawartość pliku: ../rls-policies.sql
   ```

3. **Tabela Lessons** (dla systemu rozliczeń):
   ```sql
   -- Skopiuj zawartość pliku: ../lessons-table.sql
   ```

### 1.3 Pobierz dane dostępowe

1. W Supabase Dashboard przejdź do: **Settings** → **API**
2. Skopiuj:
   - **Project URL** (np. `https://xxxxx.supabase.co`)
   - **anon/public key** (długi token JWT)

## 🚀 Krok 2: Deployment na Vercel

### 2.1 Import projektu

1. Zaloguj się do [Vercel Dashboard](https://vercel.com/dashboard)
2. Kliknij **"Add New..."** → **"Project"**
3. Wybierz swoje repozytorium Git
4. Jeśli aplikacja jest w podfolderze, ustaw **Root Directory** na: `CLI_AW/aw`

### 2.2 Konfiguracja Build Settings

Vercel powinien automatycznie wykryć Next.js, ale upewnij się że:

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` (lub `npm run build`)
- **Output Directory**: `.next` (automatyczne)
- **Install Command**: `pnpm install` (lub `npm install`)

### 2.3 Zmienne środowiskowe

W sekcji **Environment Variables** dodaj:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**⚠️ WAŻNE**: 
- Wklej wartości skopiowane z Supabase (Krok 1.3)
- Nie dodawaj cudzysłowów wokół wartości
- Upewnij się że nie ma spacji przed/po wartościach

### 2.4 Deploy

1. Kliknij **"Deploy"**
2. Poczekaj na zakończenie procesu (2-5 minut)
3. Po zakończeniu otrzymasz URL typu: `https://your-app.vercel.app`

## ✅ Krok 3: Weryfikacja deploymentu

### 3.1 Testowanie podstawowych funkcji

1. Otwórz swoją aplikację w przeglądarce
2. Sprawdź czy strona logowania się ładuje
3. Spróbuj się zalogować (jeśli masz już utworzone konto w Supabase Auth)
4. Sprawdź czy nawigacja działa poprawnie

### 3.2 Sprawdzenie logów

Jeśli coś nie działa:

1. W Vercel Dashboard przejdź do: **Deployments** → wybierz swój deployment
2. Kliknij zakładkę **"Logs"**
3. Sprawdź czy są błędy związane z:
   - Brakującymi zmiennymi środowiskowymi
   - Połączeniem z Supabase
   - Błędami TypeScript

## 🔧 Krok 4: Konfiguracja Supabase Auth (opcjonalne)

### 4.1 Dodaj URL aplikacji do Supabase

1. W Supabase Dashboard: **Authentication** → **URL Configuration**
2. Dodaj swój Vercel URL do **Site URL**: `https://your-app.vercel.app`
3. Dodaj do **Redirect URLs**:
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/**` (wildcard)

### 4.2 Utwórz pierwszego użytkownika

Opcja A - Przez Supabase Dashboard:
1. **Authentication** → **Users** → **Add user**
2. Wprowadź email i hasło
3. Kliknij **Create user**

Opcja B - Przez SQL:
```sql
-- Utwórz użytkownika auth
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role)
VALUES ('admin@akademiawiedzy.pl', crypt('your_password', gen_salt('bf')), now(), 'authenticated');

-- Utwórz profil z rolą admin
INSERT INTO public.profiles (id, role)
SELECT id, 'admin'::user_role FROM auth.users WHERE email = 'admin@akademiawiedzy.pl';
```

## 🔄 Automatyczne Deploymenty

Vercel automatycznie deployuje przy każdym:
- **Push do main/master** → Production deployment
- **Push do innych branchy** → Preview deployment
- **Pull Request** → Preview deployment z linkiem w PR

## 🌐 Własna Domena (opcjonalne)

### Dodanie własnej domeny

1. W Vercel Dashboard: **Settings** → **Domains**
2. Kliknij **"Add"**
3. Wprowadź swoją domenę (np. `akademiawiedzy.pl`)
4. Skonfiguruj DNS zgodnie z instrukcjami Vercel:
   - **Type A**: wskaż na IP Vercel
   - **lub Type CNAME**: wskaż na `cname.vercel-dns.com`
5. Poczekaj na propagację DNS (może zająć do 48h)

### Aktualizacja Supabase Auth

Po dodaniu własnej domeny, zaktualizuj w Supabase:
- **Site URL**: `https://twoja-domena.pl`
- **Redirect URLs**: `https://twoja-domena.pl/**`

## 📊 Monitoring i Konserwacja

### Sprawdzanie statusu

- **Vercel Analytics**: Automatycznie włączone dla ruchu i wydajności
- **Supabase Logs**: **Logs Explorer** w Supabase Dashboard
- **Error Tracking**: Sprawdzaj Vercel Logs regularnie

### Aktualizacje

Aby zaktualizować aplikację:
1. Wprowadź zmiany w kodzie
2. Commituj do Git
3. Push do repozytorium
4. Vercel automatycznie zbuduje i wdroży nową wersję

### Rollback

Jeśli coś pójdzie nie tak:
1. W Vercel: **Deployments**
2. Znajdź poprzedni działający deployment
3. Kliknij **"⋯"** → **"Promote to Production"**

## 🐛 Rozwiązywanie problemów

### Błąd: "Invalid JWT token"
- Sprawdź czy zmienne środowiskowe są poprawnie ustawione
- Zweryfikuj czy używasz `anon key` a nie `service_role key`

### Błąd: "Failed to fetch"
- Sprawdź czy URL Supabase jest poprawny
- Upewnij się że projekt Supabase jest aktywny
- Sprawdź CORS settings w Supabase

### Błąd 404 po zalogowaniu
- Sprawdź czy middleware.ts działa poprawnie
- Zweryfikuj ścieżki w konfiguracji middleware

### Build Failed
- Sprawdź błędy TypeScript: `pnpm type-check`
- Sprawdź linting: `pnpm lint`
- Upewnij się że wszystkie dependencies są zainstalowane

## 📱 Kontakt i Wsparcie

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## ✨ Funkcje produkcyjne

Aplikacja w produkcji automatycznie korzysta z:
- ✅ Server-Side Rendering (SSR)
- ✅ Automatic HTTPS (SSL)
- ✅ Global CDN
- ✅ Automatic compression
- ✅ Image optimization
- ✅ Edge caching
- ✅ Security headers

---

**Gratulacje!** 🎉 Twoja aplikacja Akademia Wiedzy jest teraz online i gotowa do użycia!

