# TripSync — Group Travel Planner

A mobile-first group trip planning app built for India. Resolves the friction of "let's plan a trip" WhatsApp threads by giving every group member a structured flow to share preferences, vote on destinations, mark availability, and split expenses.

## ✨ Features

| Feature | What it does |
|---|---|
| 🗳️ **Destination vote** | Members each get a vote — most preferred wins |
| 🤫 **Anonymous budget** | Private inputs → shared range visible to the group |
| ✨ **AI itinerary** | Gemini generates a day-by-day plan from group preferences |
| 💬 **Hinglish expenses** | Type "Maine 800 diye for everyone" and it parses automatically |
| 📋 **Task board** | Assign pre-trip tasks to members |
| 📅 **Availability calendar** | Mark your free dates, see group overlap |

## 🚀 Demo

The app loads a pre-filled Goa trip with 5 members — no sign-up required. Just click **Explore demo** on the home page.

## 🛠 Tech Stack

- **Frontend**: React 18 + Vite
- **State**: Zustand
- **Routing**: React Router v6
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API (mocked in demo)
- **Dates**: date-fns

## ⚙️ Local Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/tripsync.git
cd tripsync
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your Supabase and Gemini keys in `.env`.

### 3. Run database schema

Run `supabase_schema.sql` in your Supabase SQL editor to create all tables.

### 4. Start dev server

```bash
npm run dev
```

App runs at `http://localhost:5173`.

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_GEMINI_API_KEY` | Google Gemini API key (optional — demo uses mocks) |

## 📱 Mobile-first design

The app renders in a phone frame on desktop and goes full-width on actual mobile devices. Designed at 390px (iPhone 14) viewport.

## 🗂 Project Structure

```
src/
├── components/       # Shared UI (BottomNav, Icon, Toast)
├── lib/              # Supabase client, AI helpers, demo data
├── pages/            # Route-level components
├── store/            # Zustand trip store
└── styles/           # Design system CSS
```

---

Built as a PM learning project to prototype a real product end-to-end.
