# Zasady Budowy Projektu CLI_AW

## 1. Komponenty UI - shadcn/ui

### 1.1 Główna Zasada
**Wszystkie elementy interfejsu użytkownika MUSZĄ być budowane wyłącznie z komponentów shadcn/ui.**

### 1.2 Zakaz Tworzenia Własnych Komponentów UI
- ❌ NIE twórz własnych komponentów UI od podstaw
- ❌ NIE stylizuj elementów HTML bezpośrednio jako zamienników komponentów shadcn
- ❌ NIE kopiuj kodu komponentów shadcn ręcznie
- ✅ ZAWSZE używaj oficjalnych komponentów shadcn/ui

### 1.3 Procedura Gdy Brakuje Komponentu

Jeśli potrzebujesz komponentu shadcn/ui, którego nie ma w projekcie:

1. **ZATRZYMAJ pracę** nad daną funkcjonalnością
2. **POPROŚ użytkownika** o zainstalowanie brakującego komponentu
3. **PODAJ dokładną komendę** do zainstalowania, np.:
   ```bash
   npx shadcn@latest add [nazwa-komponentu]
   ```
4. **POCZEKAJ** aż użytkownik zainstaluje komponent
5. **KONTYNUUJ** dopiero po potwierdzeniu instalacji

### 1.4 Dostępne Komponenty shadcn/ui

Aktualnie zainstalowane komponenty w projekcie:
- avatar
- badge
- breadcrumb
- button
- card
- chart
- checkbox
- drawer
- dropdown-menu
- field
- input
- label
- select
- separator
- sheet
- sidebar
- skeleton
- sonner (toast notifications)
- table
- tabs
- toggle-group
- toggle
- tooltip

### 1.5 Często Potrzebne Komponenty (do zainstalowania w razie potrzeby)

Przykłady komponentów, które mogą być potrzebne:
- `dialog` - modalne okna dialogowe
- `form` - formularze z walidacją
- `popover` - wyskakujące elementy
- `switch` - przełączniki
- `textarea` - wieloliniowe pola tekstowe
- `calendar` - kalendarz
- `command` - paleta komend
- `accordion` - rozwijane sekcje
- `alert` - powiadomienia i alerty
- `progress` - paski postępu
- `slider` - suwaki
- `radio-group` - grupy radio buttonów

## 2. Struktura Projektu

### 2.1 Organizacja Zakładek/Tabów
Każda nowa zakładka (tab) w aplikacji musi mieć:
- **Osobny folder** w strukturze `app/`
- **Podstrony** umieszczone wewnątrz tego folderu jako subpages
- Przykład:
  ```
  app/
    dashboard/
      page.tsx          # główna strona dashboard
      analytics/
        page.tsx        # podstrona analytics
      settings/
        page.tsx        # podstrona settings
  ```

### 2.2 Komponenty
- Wszystkie komponenty umieszczaj w folderze `components/`
- Komponenty UI shadcn w `components/ui/`
- Własne komponenty biznesowe bezpośrednio w `components/`

#### 2.2.1 Wydzielanie Komponentów ze Stron
**Każda strona musi składać się z oddzielnych komponentów - NIE twórz długich plików stron.**

##### Główna Zasada
- ✅ **Każda logiczna część strony** musi być osobnym komponentem
- ✅ **Pliki page.tsx** powinny być krótkie i zawierać głównie kompozycję komponentów
- ✅ **Maksymalnie 100-150 linii** w pliku page.tsx
- ❌ **NIE umieszczaj** całej logiki i UI bezpośrednio w page.tsx

##### Przykład Złej Praktyki
```tsx
// ❌ ŹLE - wszystko w jednym pliku page.tsx (500+ linii)
export default function DashboardPage() {
  return (
    <div>
      {/* 200 linii kodu nagłówka */}
      {/* 150 linii kodu statystyk */}
      {/* 200 linii kodu wykresów */}
    </div>
  )
}
```

##### Przykład Dobrej Praktyki
```tsx
// ✅ DOBRZE - page.tsx jako kompozycja (30 linii)
import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardStats } from '@/components/dashboard-stats'
import { DashboardCharts } from '@/components/dashboard-charts'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader />
      <DashboardStats />
      <DashboardCharts />
    </div>
  )
}
```

##### Gdzie Umieszczać Komponenty
- **Komponenty specyficzne dla jednej strony**: w tym samym folderze co page.tsx
  ```
  app/
    dashboard/
      page.tsx
      dashboard-header.tsx
      dashboard-stats.tsx
      dashboard-charts.tsx
  ```
- **Komponenty używane w wielu miejscach**: w folderze `components/`
  ```
  components/
    dashboard-header.tsx
    dashboard-stats.tsx
  ```

##### Co Wydzielać do Komponentów
- Sekcje strony (header, footer, sidebar, main content)
- Karty z danymi
- Formularze
- Listy i tabele
- Wykresy i wizualizacje
- Modale i dialogi
- Każdy powtarzalny fragment UI

### 2.3 Układ Aplikacji
- **Sidebar** musi być obecny na wszystkich stronach aplikacji
- **Top menu (header)** musi być obecny na wszystkich stronach aplikacji
- Używaj layoutu z `app/layout.tsx` do zapewnienia spójności

## 3. Stylowanie

### 3.1 Tailwind CSS
- Używaj Tailwind CSS do stylowania
- Trzymaj się utility classes z Tailwind
- Zachowuj spójność z motywem shadcn/ui

### 3.2 Plik globals.css
- Definiuj zmienne CSS dla motywu (colors, radius, etc.)
- Nie dodawaj nadmiernych globalnych stylów
- Zachowaj kompatybilność z shadcn/ui theme system

## 4. Zarządzanie Zależnościami

### 4.1 Instalacja Pakietów
- Asystent AI **NIE uruchamia** komend instalacyjnych automatycznie
- Asystent **DOSTARCZA komendy** do ręcznego wykonania przez użytkownika
- Użytkownik sam wpisuje i wykonuje komendy w terminalu

### 4.2 Package Manager
- Projekt używa **pnpm** jako managera pakietów
- Wszystkie komendy instalacyjne powinny używać pnpm

## 5. Zakres Pracy AI

### 5.1 Główna Zasada - Dokładnie To Co Zostało Zlecone
**AI MUSI budować TYLKO to, o co użytkownik wyraźnie poprosił. Nic więcej, nic mniej.**

### 5.2 Zakazy
- ❌ NIE dodawaj funkcjonalności "od siebie" bez zgody użytkownika
- ❌ NIE implementuj dodatkowych "usprawnień" bez pytania
- ❌ NIE twórz dodatkowych plików "dla wygody" bez zgody
- ❌ NIE rozbudowuj rozwiązania poza określony zakres
- ❌ NIE zakładaj że "to też może być potrzebne"

### 5.3 Wymagana Zgoda
Jeśli AI chce dodać coś poza wyraźnie określony zakres zlecenia:
1. **ZATRZYMAJ** implementację
2. **ZAPROPONUJ** użytkownikowi dodatkową funkcjonalność
3. **POCZEKAJ** na wyraźną zgodę użytkownika
4. **KONTYNUUJ** dopiero po otrzymaniu zgody

### 5.4 Przykłady

**❌ ŹLE:**
```
Użytkownik: "Dodaj przycisk zapisu"
AI: *dodaje przycisk zapisu + walidację + powiadomienia + animacje*
```

**✅ DOBRZE:**
```
Użytkownik: "Dodaj przycisk zapisu"
AI: *dodaje TYLKO przycisk zapisu*
```

**✅ DOBRZE (gdy AI chce coś zaproponować):**
```
Użytkownik: "Dodaj przycisk zapisu"
AI: "Dodam przycisk zapisu. Czy chcesz też dodać walidację 
     i powiadomienie o sukcesie?"
Użytkownik: "Tak"
AI: *teraz dodaje przycisk + walidację + powiadomienie*
```

## 6. Dobre Praktyki

### 6.1 Kod
- Pisz czytelny, dobrze sformatowany kod TypeScript
- Używaj TypeScript types zamiast any
- Dodawaj komentarze do złożonej logiki

### 6.2 Komponenty
- Twórz małe, reużywalne komponenty
- Oddzielaj logikę biznesową od prezentacji
- Używaj kompozycji zamiast dziedziczenia

### 6.3 Nazewnictwo
- Pliki komponentów: `kebab-case.tsx` (np. `user-profile.tsx`)
- Komponenty React: `PascalCase` (np. `UserProfile`)
- Funkcje i zmienne: `camelCase` (np. `getUserData`)

### 6.4 Spójność Wzorców UI
**AI MUSI dążyć do używania identycznych lub bardzo podobnych rozwiązań dla podobnych funkcjonalności w całej aplikacji.**

#### Główna Zasada
- ✅ **Zachowaj spójność** - jeśli jakaś funkcjonalność jest już zaimplementowana w innej części aplikacji, użyj tego samego wzorca
- ✅ **Analogiczne operacje** - edycja, dodawanie, usuwanie powinny wyglądać i działać podobnie dla wszystkich encji
- ✅ **Te same komponenty** - używaj tych samych typów komponentów dla podobnych zadań

#### Przykłady
**✅ DOBRZE:**
```
- Edycja ucznia: AddStudentDialog + StudentCard
- Edycja tutora: AddTutorDialog + TutorCard
→ Obie funkcjonalności używają tego samego wzorca: Dialog + Card
```

**❌ ŹLE:**
```
- Edycja ucznia: AddStudentDialog + StudentCard
- Edycja tutora: InlineEditForm + TutorPanel
→ Różne wzorce dla tej samej funkcjonalności
```

#### Procedura
1. **SPRAWDŹ** czy podobna funkcjonalność już istnieje w projekcie
2. **PRZEANALIZUJ** jakie komponenty i wzorce zostały użyte
3. **ZASTOSUJ** ten sam wzorzec dla nowej funkcjonalności
4. **ZAPYTAJ** użytkownika jeśli nie jesteś pewien czy zachować spójność czy użyć innego podejścia

#### Przykłady Zastosowania
- Dodawanie encji → zawsze `add-[nazwa]-dialog.tsx`
- Edycja encji → zawsze ten sam typ dialogu/formularza
- Wyświetlanie szczegółów → zawsze `[nazwa]-card.tsx` lub `[nazwa]-details-panel.tsx`
- Usuwanie encji → zawsze ten sam typ potwierdzenia
- Listy encji → zawsze ten sam typ tabeli/kartek

## 7. Workflow Rozwoju

### 7.1 Dodawanie Nowej Funkcjonalności
1. Sprawdź czy potrzebne komponenty shadcn/ui są zainstalowane
2. Jeśli nie - poproś o instalację
3. Stwórz odpowiednią strukturę folderów
4. Zaimplementuj funkcjonalność używając komponentów shadcn/ui
5. Przetestuj działanie

### 7.2 Refaktoryzacja
- Zachowaj zgodność z zasadami projektu
- Nie zamieniaj komponentów shadcn na własne implementacje
- Utrzymuj spójną strukturę folderów

---

## Podsumowanie - Najważniejsze Zasady

1. ✅ **Tylko shadcn/ui** dla wszystkich komponentów UI
2. ✅ **Proś o instalację** brakujących komponentów
3. ✅ **Osobne foldery** dla każdej zakładki
4. ✅ **Sidebar i top menu** na wszystkich stronach
5. ✅ **Wydzielaj komponenty** - każda część strony jako osobny komponent, max 100-150 linii w page.tsx
6. ✅ **Komendy manualne** - AI nie uruchamia ich automatycznie
7. ✅ **Tylko zlecone zadania** - AI nie dodaje funkcjonalności bez zgody użytkownika
8. ✅ **Spójność wzorców UI** - używaj tych samych rozwiązań dla podobnych funkcjonalności (np. jeśli edycja ucznia to Dialog + Card, to edycja tutora też Dialog + Card)

---

*Dokument utworzony: 6 października 2025*

