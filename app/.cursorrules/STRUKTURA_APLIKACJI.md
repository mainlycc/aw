# Akademia Wiedzy - Struktura Aplikacji

## Opis Projektu

**Akademia Wiedzy** to aplikacja webowa dla firmy prowadzącej korepetycje online.

### Role Użytkowników
1. **Admin** - administrator systemu
2. **Tutor** - korepetytorzy

## Moduły Aplikacji

### 1. Moduł Autoryzacji
- Rejestracja
- Logowanie
- Wylogowanie

### 2. Panel Admina
Panel dla użytkowników z rolą Admin

### 3. Panel Tutora
Panel dla użytkowników z rolą Tutor (korepetytorzy)

## Proponowana Struktura Plików

```
aw/
├── app/
│   ├── layout.tsx                    # Główny layout z sidebar i header
│   ├── page.tsx                      # Strona główna (przekierowanie)
│   │
│   ├── login/
│   │   └── page.tsx                  # Strona logowania
│   │
│   ├── register/
│   │   └── page.tsx                  # Strona rejestracji
│   │
│   ├── admin/
│   │   ├── layout.tsx                # Layout dla panelu admina
│   │   ├── page.tsx                  # Dashboard admina
│   │   └── ...                       # Inne podstrony admina
│   │
│   └── tutor/
│       ├── layout.tsx                # Layout dla panelu tutora
│       ├── page.tsx                  # Dashboard tutora
│       └── ...                       # Inne podstrony tutora
│
├── components/
│   ├── ui/                           # Komponenty shadcn/ui
│   ├── app-sidebar.tsx               # Sidebar aplikacji
│   ├── site-header.tsx               # Header aplikacji
│   ├── login-form.tsx                # Formularz logowania
│   ├── register-form.tsx             # Formularz rejestracji
│   └── ...                           # Inne komponenty
│
├── lib/
│   ├── utils.ts                      # Utility functions
│   └── supabase/
│       ├── client.ts                 # Klient Supabase (browser)
│       └── server.ts                 # Klient Supabase (server)
│
└── hooks/
    └── ...                           # Custom hooks
```

## Szczegółowy Opis Struktury

### Moduł Autoryzacji (`/login`, `/register`)
- `app/login/page.tsx` - strona logowania
- `app/register/page.tsx` - strona rejestracji
- `components/login-form.tsx` - formularz logowania
- `components/register-form.tsx` - formularz rejestracji

### Panel Admina (`/admin`)
- `app/admin/layout.tsx` - layout specyficzny dla admina
- `app/admin/page.tsx` - główny dashboard admina
- Podstrony umieszczane w podfolderach `app/admin/[nazwa]/`

### Panel Tutora (`/tutor`)
- `app/tutor/layout.tsx` - layout specyficzny dla tutora
- `app/tutor/page.tsx` - główny dashboard tutora
- Podstrony umieszczane w podfolderach `app/tutor/[nazwa]/`

## Routing

| Ścieżka | Dostęp | Opis |
|---------|--------|------|
| `/` | Publiczny | Strona główna (przekierowanie do `/login` lub odpowiedniego panelu) |
| `/login` | Publiczny | Strona logowania |
| `/register` | Publiczny | Strona rejestracji |
| `/admin/*` | Admin | Panel administratora |
| `/tutor/*` | Tutor | Panel korepetytora |

## Komponenty Wspólne

### Sidebar (`app-sidebar.tsx`)
- Różna zawartość w zależności od roli użytkownika
- Obecny na wszystkich stronach po zalogowaniu

### Header (`site-header.tsx`)
- Informacje o zalogowanym użytkowniku
- Menu użytkownika
- Obecny na wszystkich stronach po zalogowaniu

---

*Dokument utworzony: 6 października 2025*

