# Referral Bonus Ecosystem — Consumer Panel System

A full-stack web application that automates the referral lifecycle for a consumer panel. The system tracks link sharing, attributes incoming sign-ups to the correct referrer, and exposes transparent status progress to panel members.

## 🎥 Architecture Walkthrough Video
Watch the system walkthrough and architecture explanation: **Google Drive Video Link- https://drive.google.com/file/d/1Y5y_QJW0dCdIk15STmwHESFPv17GkyAD/view?usp=sharing)**

## Quick Start (under 5 minutes)

### Prerequisites
- Node.js 18+
- A Supabase project (credentials are pre-configured in `.env`)

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Create a `.env` file in the project root with the following:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> The Supabase project is already provisioned. If you do not have the values, they are available in the project settings.

### 3. Run the app
```bash
npm run dev
```
The app will open at `http://localhost:5173`.

### 4. Build for production
```bash
npm run build
```

## Application Overview

### Pages

| Route | Description |
|-------|-------------|
| `/` | **Admin Dashboard** — Data grid with all respondents, real-time search, multi-field filters (city, category, source, status), metrics panel, CSV export, and "Add Respondent" modal |
| `/members` | **Panel Members** — List of all members with referral code generation and copy-to-clipboard link sharing |
| `/referrals` | **Referral Lifecycle** — Full pipeline view (Lead → Fit → Completion). Admins can advance or reject referrals |
| `/portal` | **Member Self-Service Portal** — Members can look up their profile, see their referral link, and track each referral's status and payout |
| `/signup?ref=CODE` | **Public Registration** — New respondents sign up using a member's referral link. Automatically attributes the referral |

### Key Features

1. **Data Ingestion & Grid** — Baseline respondents are loaded from Supabase and displayed in a clean, paginated table with sorting, search, and filters.
2. **Real-Time Querying** — Search instantly filters across name, email, city, and phone.
3. **Segment Filtering** — Dropdown filters for city, category, source, and status.
4. **Metrics Dashboard** — Total panel count, active members, referral leads, total payouts, and category breakdown.
5. **Dynamic Add Form** — "Add Respondent" modal with validation and duplicate email detection.
6. **CSV Export** — Download the current filtered view as a structured CSV.
7. **AI Categorization** — Edge function (`ai-categorize`) that reads unstructured notes and suggests a category tag. Uses OpenAI if an API key is configured; otherwise falls back to keyword matching.
8. **Self-Service Portal** — Members can track their own referral progress without contacting ops.
9. **Referral Link System** — Each member gets a unique code. Links are `/?ref=CODE` on the public sign-up page. Attribution is automatic.

## Database Schema

- **`members`** — Existing panel members with unique referral codes and earnings tracking.
- **`respondents`** — All panel respondents (baseline + new sign-ups). Tracks source and status.
- **`referrals`** — The referral lifecycle record. Stages: `lead` → `fit` → `completion` (or `rejected`).
- **`surveys`** — Available survey projects for matching referrals.

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Routing**: React Router v6
- **State**: Local React state (useState + useEffect) — no external state library needed for MVP
- **Data Access**: `@supabase/supabase-js` client with RLS enabled

## Edge Functions

- **`ai-categorize`** — Proxies to OpenAI (or keyword fallback) for unstructured note categorization.

## Notes

- All tables have RLS enabled. For this MVP demo, policies are open to `anon` and `authenticated` so the app works without sign-in.
- In production, you would switch to authenticated-only policies and add login.
- The referral system is fully automated: a new sign-up via `/signup?ref=CODE` creates a respondent and a referral record, increments the member's referral count, and places the referral in the `lead` stage.
