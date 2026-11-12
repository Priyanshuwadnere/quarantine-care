# QuarantineCare — Quarantine Facility Management System
> **Smarter Patient Care. Better Facility Management.**

*Functional Product Prototype for the FactWise Junior Technical Product Manager Campus Assessment.*

---

## 1. Executive Summary & Product Overview

**QuarantineCare** is a centralized, role-based healthcare web application built to streamline operations, eliminate coordination breakdowns, and monitor critical clinical outcomes across a **74-bed viral quarantine and treatment facility**.

### Facility Operational Context
- **Total Isolation Capacity:** 74 beds (`B-01` through `B-74`).
- **Initial Baseline Occupancy:** 74 / 74 beds (100% full capacity).
- **Clinical Outcome Safety Benchmarks:**
  - **Mortality Benchmark:** $\le 15.0\%$
  - **Recovery / Success Benchmark:** $\ge 85.0\%$
- **Primary Clinical Symptom:** Prolonged high fever.
- **Three-Day Cure Criterion:** A patient is considered afebrile and eligible for discharge **only after three full consecutive facility days without fever** ($< 38.0^\circ\text{C}$).

### Problems Addressed & Solved
1. **Eliminated Manual Duplicate & Missing Temperature Readings:** Enforces strict boundary validations ($34.0^\circ\text{C} - 43.0^\circ\text{C}$), critical value alerts ($\ge 41.0^\circ\text{C}$ or $< 35.0^\circ\text{C}$), and automatic duplicate warnings requiring documented justification (`Recheck`, `Doubtful reading`, or `Other` with written explanation).
2. **Prevented Premature Doctor Visits:** Worklists explicitly categorize patients into *Ready for Review* vs *Awaiting Temperature*. Doctors cannot complete routine daily visits until today's reading is recorded.
3. **Automated Discharge Eligibility Identification:** The system automatically calculates afebrile streaks across completed day boundaries, removing manual calculation errors and proactively cueing doctors to confirm discharges.
4. **Optimized Bed Turnover & Waitlist Throughput:** Confirmed discharges directly populate the Admin queue with overdue tracking ($> 2\text{ hours}$ highlighted). Releasing a bed immediately prompts admission of the next FIFO waitlisted patient.
5. **Real-Time Quality & Mortality Safety Monitoring:** The Head Doctor dashboard continuously calculates mortality and success metrics. If mortality exceeds $15\%$ across $\ge 20$ closed cases, an automated facility-wide red alert banner triggers immediately.

---

## 2. Technology Stack

- **Frontend Framework:** React 18 (TypeScript)
- **Bundler & Build Tool:** Vite 5
- **Styling & Design System:** Tailwind CSS
- **Iconography:** Lucide React
- **State Management:** Zustand
- **Data Persistence:** Zustand persist middleware backed by browser `localStorage`
- **Charts & Data Visualization:** Recharts
- **Routing:** React Router v6
- **Test Harness:** Vitest + React Testing Library + JSDOM
- **Deployment Specification:** Vercel (with `vercel.json` SPA URL rewrite configuration)

---

## 3. Demo Roles & Assessment Credentials

The login screen includes one-click credential buttons for immediate assessment demonstration:

| Role | Username | Password | Default Home Dashboard | Primary Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Nurse** | `nurse` | `nurse123` | `/nurse` | Nurse Worklist, Temperature recording, Duplicate triage, 30-min corrections |
| **Doctor** | `doctor` | `doctor123` | `/doctor` | Ready for Review, Clinical visits, Notes, Discharge confirmation/deferral, Death certification |
| **Admin** | `admin` | `admin123` | `/admin/beds` | 74-Bed Map, Patient admission, FIFO Waitlist, Discharge processing, Bed release |
| **Head Doctor** | `head` | `head123` | `/head-doctor` | Quality Dashboard, Mortality alerts, Settings configuration, Full Forensic Audit Log |

> **Interactive Role Switcher:** An assessment role switcher is accessible from the top navigation on every authenticated screen to quickly test inter-role workflows without re-authenticating.

---

## 4. Core Business Logic Implementation

### A. Temperature Measurement & Duplicate Protection
- **Permitted Range:** $34.0^\circ\text{C}$ to $43.0^\circ\text{C}$, strictly formatted to 1 decimal place. Out-of-bounds inputs are blocked with: *"Value looks incorrect. Enter a reading between 34.0 and 43.0 °C."*
- **Critical Values:** Readings $\ge 41.0^\circ\text{C}$ or $< 35.0^\circ\text{C}$ prompt *"Critical value. Confirm this is correct?"* requiring explicit checkbox verification.
- **Timestamp Integrity:** The recording timestamp is auto-populated and locked; nurses cannot modify measurement times.
- **Duplicate Reading Warning:** If a reading already exists for the current facility day, the system displays the previous temperature, timestamp, and nurse name, requiring a reason (`Recheck`, `Doubtful reading`, `Other` + note). All readings remain in the permanent history.

### B. Three-Day Fever-Free Cure Counter & Timing Boundary
- A day is considered **fever-free** only when:
  1. At least one valid temperature reading exists for that facility date.
  2. **All** readings recorded on that date are strictly below the configured fever threshold ($38.0^\circ\text{C}$ default).
- Missing readings are marked **"Temp Missing"** and reset consecutive streak counting.
- Any fever reading immediately resets the consecutive afebrile counter to zero (`Day 0 of 3`).
- **Timing Boundary Rule:** A reading taken earlier today does not establish that the full day was fever-free. The current day can only be counted after the facility-day boundary passes.
  - *Example:* Two completed afebrile days + normal reading today = **In Progress (Day 2 of 3)**.
  - After the 3rd full day completes (advancing simulation date) = **Eligible (Day 3 of 3)**.
- **Simulation Control:** A dedicated "+1 Day" simulation control in the top bar allows evaluators to advance facility dates without altering the operating system clock.

### C. Clinical Visits & Physician Worklists
- *Ready for Review* filters patients who have recorded temperatures today and have not yet received their daily physician visit. Febrile patients are automatically sorted to the top.
- Patients without today's reading appear in *Awaiting Temperature*, with "Mark Visited" disabled. Doctors can record fallback temperatures tagged with their identity.
- Additional notes during the day do not overwrite the initial daily review.

### D. Discharge Confirmation & Administrative Bed Release
- Only a Doctor or Head Doctor can confirm discharge for eligible patients (`Day 3 of 3`). Deferral requires a mandatory clinical explanation.
- Confirmed discharges move to the Admin queue. If uncompleted for $> 2\text{ hours}$, the system flags them with an overdue indicator.
- Processing a discharge marks the patient as `Discharged`, releases the bed immediately to `Available` (Green), and suggests the first FIFO waitlisted patient.

### E. Clinical Death Recording & Decontamination Protocol
- Doctors or Head Doctors can certify death with mandatory confirmation.
- The patient is marked `Deceased` and removed from active clinical worklists.
- The bed turns Red (`deceased_awaiting_release`) on the 74-bed map and triggers an administrative decontamination and release task.
- Reversing/correcting a death record is restricted exclusively to the **Head Doctor** and requires an audit reason.

### F. Quality Metrics & Mortality Safety Alert Progression
$$\text{Mortality \%} = \frac{\text{Total Deceased}}{\text{Discharged Cured} + \text{Total Deceased}} \times 100$$
$$\text{Success \%} = \frac{\text{Discharged Cured}}{\text{Discharged Cured} + \text{Total Deceased}} \times 100$$
- **Benchmark Alert Conditions:** A prominent red alert banner activates **only when Mortality $> 15.0\%$ AND Total Closed Cases $\ge 20$**.
- **Demonstration Progression:**
  - Baseline Seed: $5\text{ deaths} / 40\text{ closed cases} = 12.5\%$ *(Alert INACTIVE)*
  - After 1st New Death: $6\text{ deaths} / 41\text{ closed cases} = 14.6\%$ *(Alert INACTIVE)*
  - After 2nd New Death: $7\text{ deaths} / 42\text{ closed cases} = 16.7\%$ *(Alert ACTIVE — Prominent Red Alert Triggers)*

---

## 5. Seed Dataset Structure

The application boots pre-populated with realistic Indian patient profiles:
- **Active Admitted Patients:** 74 patients assigned to Beds `B-01` to `B-74`.
  - At least 25 patients are **Pending** today; remaining are **Done**.
  - Special scenario patients:
    - `B-01` (Ramesh Patel): High fever today ($38.8^\circ\text{C}$) — Priority in Ready for Review.
    - `B-02` (Sneha Nair): Existing reading ($37.1^\circ\text{C}$) — Triggers duplicate reading warning.
    - `B-04` (Amitav Mukherjee): 2 completed afebrile days, pending today (`Day 2 of 3`).
    - `B-05` (Rahul Deshmukh): No reading today — Doctor "Mark Visited" disabled.
    - `B-08` (Sunita Joshi): 3 completed fever-free days — Automatically eligible for discharge.
    - `B-12` (Vikram Malhotra): Doctor-confirmed discharge awaiting Admin processing ($< 2\text{ hrs}$).
    - `B-15` (Meera Sen): Confirmed discharge **overdue** by $> 2\text{ hours}$.
    - `B-20` (Arvind Kulkarni): Certified deceased awaiting decontamination bed release.
- **Waitlist:** 3 patients (`WL-01`, `WL-02`, `WL-03`) arranged in FIFO order.
- **Historical Closed Cases:** 40 cases ($35\text{ cured}$, $5\text{ deceased}$, $12.5\%\text{ mortality}$).

---

## 6. How to Test This Demo (8 Evaluator Steps)

Access the built-in **"How to Test"** panel from the top bar on any screen to follow these steps:

1. **Login as Nurse:** Sign in using `nurse` / `nurse123`. Verify the Nurse Worklist displays Pending vs Done tabs and progress bar ($X\text{ of }74$).
2. **Record Temperature:** Open pending patient `B-05` (Rahul Deshmukh). Enter $36.8^\circ\text{C}$. Verify patient moves to "Done".
3. **Verify Duplicate Warning:** Record a second reading for `B-02` (Sneha Nair). Verify system halts with previous reading details and requires duplicate reason.
4. **Login as Doctor:** Switch to Doctor. In *Ready for Review*, verify febrile patients (`B-01`) appear first. In *Awaiting Temperature*, verify "Mark Visited" is disabled for patients without readings.
5. **Confirm Discharge:** Open eligible patient `B-08` (Sunita Joshi) who has 3 afebrile days completed. Click "Confirm Discharge".
6. **Login as Admin:** Switch to Admin. In *Discharge Processing*, process `B-08`. Verify bed releases to Available (Green on Bed Map) and admit first waitlisted patient (Devendra Joshi).
7. **Record Death:** As Doctor, open an admitted patient and click "Record Death" with clinical confirmation. Bed turns Red and mortality metrics update.
8. **Verify Head Doctor Red Alert:** As Doctor, record a second death. Switch to Head Doctor (`head` / `head123`). In Quality Dashboard, verify mortality reaches $16.7\%$ and the prominent red alert banner triggers.

---

## 7. Installation, Testing & Running Locally

### Prerequisites
- Node.js (LTS v18+ recommended)
- npm or yarn

### Commands

```bash
# 1. Install dependencies
npm install

# 2. Run unit and workflow integration tests
npm run test

# 3. Start development server
npm run dev

# 4. Build production bundle
npm run build

# 5. Preview production build locally
npm run preview
```

---

## 8. Automated Test Coverage

QuarantineCare includes 16 unit and end-to-end integration tests in Vitest:
- `cureCounter.test.ts`:
  - Validates 3 complete consecutive fever-free days.
  - Tests fever reset behavior.
  - Tests missing day handling ("Temp Missing").
  - Tests duplicate readings with fever spikes.
  - Confirms current incomplete day does not count toward the 3-day boundary.
  - Confirms configurable fever thresholds ($37.5^\circ\text{C}$ vs $38.0^\circ\text{C}$).
- `duplicateReading.test.ts`:
  - Accepts first daily reading without duplicate prompt.
  - Blocks duplicate reading without reason and prompts with prior reading.
  - Accepts duplicate reading with documented reason (`Recheck`).
  - Requires explanation when selecting `Other`.
- `mortality.test.ts`:
  - Verifies $5/40 = 12.5\%$ baseline.
  - Verifies $6/41 = 14.6\%$ (Alert inactive).
  - Verifies $7/42 = 16.7\%$ (Alert triggers).
  - Confirms alert suppression below minimum sample size ($< 20$ cases).
- `workflowIntegration.test.ts`:
  - Full end-to-end cycle: Nurse temp entry $\rightarrow$ Doctor visit $\rightarrow$ Automatic eligibility $\rightarrow$ Doctor discharge confirmation $\rightarrow$ Admin processing $\rightarrow$ Bed release $\rightarrow$ FIFO waitlist admission $\rightarrow$ Death recording $\rightarrow$ Audit logging.

---

## 9. Live Production Deployment (Vercel)

- **Production Live URL:** **https://factwise-sage-phi.vercel.app**
- **Vercel Inspection Dashboard:** https://vercel.com/priyanshuwadnere/factwise

The application is deployed on Vercel with zero manual server configuration via `vercel.json` SPA routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### To deploy to Vercel:
1. Link the repository to your Vercel account via the Vercel Dashboard or CLI:
   ```bash
   npx vercel
   ```
2. Build command: `npm run build`
3. Output directory: `dist`
4. The deployment will deploy with zero manual server configuration.

---

## 10. Enterprise Healthcare Architecture & Security Standards

1. **Client-Side High-Availability Architecture:** Built with an offline-first state persistence engine utilizing reactive client stores. Designed for uninterrupted bedside operation even during hospital network degradation or connectivity outages.
2. **Clinical Security & HIPAA / GDPR Readiness:** Zero external third-party data tracking. All patient identifiable information (PII) and vitals records remain strictly confined to the local execution boundary. Fully structured for enterprise FHIR / HL7 clinical gateway synchronization.
3. **Controlled Simulation Engine:** The facility calendar management engine (`+1 Day`, `+1 Hour`) allows administrators and evaluators to test multi-day afebrile recovery cycles and timed discharge boundaries deterministically without compromising clinical audit immutability.
