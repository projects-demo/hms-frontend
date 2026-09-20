# HMS Frontend

React 19 + TypeScript + Vite + Tailwind v4. Talks to the HMS Spring Boot
backend end-to-end - login, patients, doctors, appointments, OPD, IPD,
billing, pharmacy, and the analytics dashboard are all wired to real API
calls, not mock data.

## 1. Are we ready to go?

**Yes.** This was built and verified against the backend code you shared as
the baseline - every request/response shape here matches your actual DTOs
(`ApiResponse<T>`, `PageResponse<T>`, `OptionDto`, and each module's
request/response records). It's also been **actually compiled and built**
in this environment (`tsc -b` and `vite build` both pass clean) - unlike the
backend, npm access is available here, so this isn't just code review, it's
a verified build.

## 2. What's covered

| Module | Screens |
|---|---|
| Auth | Hospital-code + username/password login, JWT with silent refresh, protected routes |
| Dashboard | Live stat cards (today's appointments, revenue, bed occupancy, low stock) + 14-day revenue chart |
| Patients | Search/list (paginated), register, edit, detail page with appointment/consultation/admission/bill history tabs |
| Doctors | List, onboard (creates login + clinical profile together) |
| Departments | List, create |
| Staff | List/filter by type, onboard (nurses, receptionists, billing staff, pharmacists, lab techs) |
| Appointments | List/filter by date & status, book (with live slot picker that auto-generates slots from the doctor's weekly availability), check-in |
| OPD | Today's checked-in queue, start/complete consultation with vitals + diagnosis + prescription builder |
| IPD | Admissions list (admit/discharge), Wards & Beds management with live occupancy |
| Billing | List/filter, create draft bill with line items, finalize (discount/tax), record payment, refund, cancel |
| Pharmacy | Drug catalog, receive stock batches, dispense (FEFO), low-stock & expiring-soon alerts |

**Deliberately out of scope for this UI:** platform-level hospital
onboarding (`/api/v1/platform/**`). That's a one-time setup step per
hospital, done by whoever runs the platform - not something hospital staff
touch day to day. Keep using Swagger/curl for that, exactly as before.

## 3. Design

Continuity with the original app's orange brand, reworked into a more
distinctive, clinical-trust palette: deep teal primary, warm coral accent,
warm-neutral backgrounds, Inter typeface. Sidebar + topbar shell - the same
layout pattern used by most enterprise HMS products, chosen because it
scales to dozens of modules without becoming a maze.

All design tokens live in `src/index.css` (Tailwind v4 `@theme` block) if
you want to retheme colors later - nothing is hardcoded in components.

## 4. Run it

```bash
cd hms-frontend
npm install
cp .env.example .env   # already done - edit if your backend isn't on localhost:8080
npm run dev
```

Opens on **http://localhost:5173**. Make sure your backend is running on
**http://localhost:8080** first (or update `VITE_API_BASE_URL` in `.env`).

**CORS note:** your backend's `application.yml` already allows
`http://localhost:5173` in `hms.cors.allowed-origins` by default - no
change needed there.

## 5. Log in

Use the same hospital code + username + password you've been testing with
in Swagger:

```
Hospital code: motherland-noida   (or whichever you onboarded)
Username: <the adminUsername you set>
Password: <the adminPassword you set>
```

From there: create a department -> onboard a doctor -> set their weekly
availability (see gap below) -> book an appointment -> run it through OPD
-> bill it -> dispense pharmacy stock. Same flow as your Swagger testing,
now with real screens.

## 6. One gap worth knowing about

**Doctor weekly availability** (the `POST /api/v1/doctors/{id}/availability`
endpoint) doesn't have a UI screen yet - the appointment booking flow's
"Load slots" button depends on it. For now, set a doctor's weekly
availability once via curl/Swagger after onboarding them:

```bash
curl -X POST http://localhost:8080/api/v1/doctors/<doctorId>/availability \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"dayOfWeek": 1, "startTime": "09:00:00", "endTime": "13:00:00", "slotDurationMins": 15}'
```

(`dayOfWeek`: 1=Monday...7=Sunday.) Once that's set, the booking dialog's
"Load slots" button will materialize and show real bookable times for that
doctor on any matching weekday. Say the word if you want this turned into
a proper screen next.

## 7. Project structure

```
src/
  lib/
    api-client.ts        Axios instance, JWT storage, auto-refresh on 401
    services/             One file per backend module - typed API calls
  types/                  api.ts (envelope types) + domain.ts (entity types)
  components/
    ui/                    Design-system primitives (Button, Input, Table, Dialog, ...)
    common/                 App-level shared components (Pagination, StatCard, AsyncCombobox, ...)
    layout/                  Sidebar, Topbar, AppLayout
  features/                 One folder per module - page(s) + module-specific dialogs
    auth/                     AuthContext, LoginPage, ProtectedRoute
    dashboard/ patients/ doctors/ departments/ staff/
    appointments/ opd/ ipd/ billing/ pharmacy/
  hooks/                   useDebounce, usePaginated (generic paginated-list data hook)
```

Every list screen uses `usePaginated` and renders `PageResponse<T>` -
consistent with the backend's "always paginate" discipline. Every
patient/doctor/drug picker uses `AsyncCombobox`, backed by the backend's
`/autocomplete` endpoints - never a full list dumped into a dropdown.

## 8. Next steps once you've tested this

- Doctor weekly-availability screen (see gap above)
- Charge-master management UI (seed this via Swagger/curl for now if you
  want named catalog items in the bill-creation picker - ad-hoc line items
  work fine without it)
- Code-splitting (route-based `lazy()`) to shrink the initial bundle -
  flagged by the build output, not urgent for local testing
