# Instrukcja Konfiguracji Logowania - Akademia Wiedzy

## ✅ Co Zostało Skonfigurowane

### 1. **Formularz Logowania**
- ✅ Pełna integracja z Supabase Auth
- ✅ Walidacja formularzy za pomocą React Hook Form + Zod
- ✅ Powiadomienia toast o sukcesie/błędzie
- ✅ Loading states podczas logowania
- ✅ Przekierowanie na dashboard po zalogowaniu

### 2. **Routing i Przekierowania**
- ✅ Strona główna `/` automatycznie przekierowuje:
  - Niezalogowanych → `/login`
  - Zalogowanych → `/dashboard`
- ✅ Middleware chroni wszystkie chronione strony
- ✅ Zalogowani użytkownicy nie mogą wejść na `/login`

### 3. **Struktura Plików**
```
aw/
├── app/
│   ├── page.tsx                    # Przekierowanie (główna strona)
│   ├── login/
│   │   └── page.tsx                # Strona logowania
│   └── dashboard/
│       └── page.tsx                # Dashboard (po zalogowaniu)
├── components/
│   └── login-form.tsx              # Komponent formularza logowania
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Klient Supabase (browser)
│   │   └── server.ts               # Klient Supabase (server)
│   └── validations/
│       └── auth.ts                 # Schemat walidacji logowania
└── middleware.ts                   # Ochrona tras
```

---

## 🔧 Wymagana Konfiguracja

### 1. Uzupełnij Zmienne Środowiskowe

**WAŻNE:** Musisz utworzyć plik `.env.local` w folderze `aw/`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj_klucz_anon
```

**Gdzie znaleźć te wartości:**
1. Wejdź na [https://app.supabase.com](https://app.supabase.com)
2. Wybierz swój projekt
3. Idź do **Settings** → **API**
4. Skopiuj:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Upewnij się, że Masz Użytkowników w Supabase

#### Sposób 1: Utwórz użytkownika przez Supabase Dashboard
1. Wejdź na [https://app.supabase.com](https://app.supabase.com)
2. Wybierz swój projekt
3. Idź do **Authentication** → **Users**
4. Kliknij **Add user** → **Create new user**
5. Wprowadź email i hasło
6. Użytkownik zostanie utworzony

#### Sposób 2: SQL - Utwórz użytkownika testowego
```sql
-- Utwórz użytkownika w auth.users (wykonaj w SQL Editor)
-- UWAGA: Hasło musi być zahashowane przez Supabase

-- 1. Użyj funkcji Supabase do utworzenia użytkownika testowego
-- (wykonaj w SQL Editor w Supabase Dashboard)

-- Dla testów możesz utworzyć użytkownika przez Dashboard lub API
```

### 3. Konfiguracja Profili (Role: Admin/Tutor)

Po utworzeniu użytkownika, musisz przypisać mu profil z rolą:

```sql
-- Wstaw profil dla użytkownika
INSERT INTO public.profiles (id, role)
VALUES 
  ('id-użytkownika-z-auth-users', 'admin'),  -- dla admina
  ('id-użytkownika-z-auth-users', 'tutor');  -- dla tutora
```

Lub użyj funkcji trigger, który automatycznie utworzy profil:

```sql
-- Funkcja tworząca profil po rejestracji
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'tutor');  -- domyślna rola
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger wywoływany po utworzeniu użytkownika
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🚀 Jak Przetestować

### 1. Uruchom Serwer Deweloperski
```bash
cd aw
pnpm dev
```

### 2. Otwórz Przeglądarkę
```
http://localhost:3000
```

Powinieneś zostać automatycznie przekierowany na `/login`

### 3. Zaloguj Się
- Wprowadź email i hasło użytkownika utworzonego w Supabase
- Kliknij "Zaloguj się"
- Po pomyślnym logowaniu → przekierowanie na `/dashboard`

### 4. Sprawdź Middleware
- Spróbuj wejść na chronione strony (np. `/dashboard`) bez logowania
- Powinieneś zostać przekierowany na `/login`
- Po zalogowaniu spróbuj wejść na `/login`
- Powinieneś zostać przekierowany na `/dashboard`

---

## 🐛 Rozwiązywanie Problemów

### Problem: "Invalid login credentials"
**Przyczyna:** Nieprawidłowy email lub hasło

**Rozwiązanie:**
1. Sprawdź czy użytkownik istnieje w Supabase Dashboard (Authentication → Users)
2. Upewnij się, że email jest poprawny
3. Zresetuj hasło użytkownika przez Dashboard

### Problem: Przekierowanie nie działa
**Przyczyna:** Middleware nie może połączyć się z Supabase

**Rozwiązanie:**
1. Sprawdź czy plik `.env.local` istnieje i ma poprawne wartości
2. Zrestartuj serwer deweloperski (`pnpm dev`)
3. Sprawdź console w przeglądarce dla błędów

### Problem: "Error: cookies() expects to have requestAsyncStorage"
**Przyczyna:** Problem z Next.js 15 i cookies

**Rozwiązanie:**
- Ten błąd powinien być już rozwiązany w kodzie
- Jeśli nadal występuje, upewnij się że używasz Next.js 15.5+

### Problem: Brak powiadomień toast
**Przyczyna:** Toaster nie został dodany do layout

**Rozwiązanie:**
- Toaster jest już dodany w `app/layout.tsx`
- Jeśli nadal nie działa, sprawdź czy component `sonner` jest poprawnie zainstalowany

---

## 📝 Kolejne Kroki

Po skonfigurowaniu logowania możesz:

1. **Dodać stronę rejestracji** (`/register`)
2. **Zaimplementować reset hasła**
3. **Dodać różne dashboardy dla Admin i Tutor**
4. **Zabezpieczyć strony według ról (RLS)**
5. **Dodać wylogowanie**

---

## 🔒 Bezpieczeństwo

✅ **Co jest już zabezpieczone:**
- Middleware chroni wszystkie chronione strony
- Hasła są hashowane przez Supabase
- Sesje zarządzane przez Supabase Auth
- Cookies httpOnly dla bezpieczeństwa

⚠️ **Co musisz jeszcze zrobić:**
- Skonfigurować Row Level Security (RLS) w Supabase dla wszystkich tabel
- Dodać polityki RLS dla ról (admin/tutor)
- Skonfigurować email templates w Supabase

---

*Dokument utworzony: 6 października 2025*

