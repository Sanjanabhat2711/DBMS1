# 🛢️ PetroFlow — Petroleum Supply Chain Dashboard

A role-based, interactive supply chain tracking system for the petroleum industry. Built with React, TypeScript, Vite, and SQLite.

---

## 📌 What This Project Does

- Tracks the full petroleum supply chain: **Crude Purchase → Refining → Storage → Distribution → Retail**
- Role-based access: each user only sees the pipeline stages relevant to their role
- Animated, real-time pipeline visualization with status tracking
- Secure audit trail with cryptographic transaction hashing
- Data stored in a local SQLite database (`petroleum_supply_chain.db`)

---

## ⚙️ How to Run Locally

**Prerequisites:** Node.js (v18+)

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment example and set your Gemini API key
cp .env.example .env
# Edit .env and set: GEMINI_API_KEY=your_key_here

# 3. Start the development server
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## 📁 Project Structure

```
petroleum_supply_chain/
├── src/
│   ├── App.tsx          # Main React app with all dashboard components
│   ├── index.css        # Global styles and design tokens
│   ├── main.tsx         # React entry point
│   └── lib/
│       └── utils.ts     # Utility helpers
├── db.ts                # SQLite database setup and queries
├── server.ts            # Backend API server (Express/Node)
├── index.html           # App entry HTML
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies
└── .env.example         # Environment variable template
```

---

## 🔄 Changes Made (Summary)

| # | Change | Description |
|---|--------|-------------|
| 1 | **Role-based pipeline** | Each role (Crude Manager, Refinery, Storage, Distribution, Retail) only sees their relevant stage |
| 2 | **Animated flow visualization** | Added animated gradient flow, travelling markers, and entrance animations on the pipeline |
| 3 | **Backend API** | Added `server.ts` with Express endpoints to read/write supply chain data to SQLite |
| 4 | **Database integration** | `db.ts` connects the frontend to a local SQLite database for real data persistence |
| 5 | **Improved UI** | Dark-themed, premium dashboard with glassmorphism cards, color-coded status badges |
| 6 | **Gemini AI integration** | AI-assisted insights powered by Gemini API for supply chain anomaly detection |
| 7 | **Zomato Web Scraper** | Added Python Selenium scraper (`Webscraping.py`) for restaurant data collection (separate module) |

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key (get it from [Google AI Studio](https://aistudio.google.com)) |
| `DATABASE_URL` | Path to SQLite DB (defaults to `./petroleum_supply_chain.db`) |

> **Note:** Never commit your `.env` file. It is excluded via `.gitignore`.

---

## 👥 Team

Built for DBMS coursework. Feel free to clone and extend!
