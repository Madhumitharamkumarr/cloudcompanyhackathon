# CampusBid 🎓

**Good finds. Fair bids. New beginnings.**

A campus-only auction marketplace where graduating students sell their used belongings and juniors bid fairly to buy them.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm v9+
- MongoDB Community Server running locally

### 1. Start the Backend

```bash
cd server
cp .env.example .env
# Set MONGODB_URI if your local MongoDB uses a different address
# Add your OpenRouter API key (optional)
npm install
npm start
# Server runs on http://localhost:5000
```

### 2. Start the Frontend

```bash
cd client
npm install
npm run dev
# App runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Demo Login

On first startup, the server seeds MongoDB with demo accounts, auctions, bids, questions, and notifications. Use these pre-seeded accounts:

| Name | Email | Password |
|------|-------|----------|
| Arjun Sharma | arjun@college.edu | password123 |
| Priya Nair | priya@college.edu | password123 |
| Rahul Gupta | rahul@college.edu | password123 |

> Demo data is only seeded into empty collections. Your MongoDB data persists across server restarts.

---

## ⚙️ Environment Variables

### `server/.env`

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/campusbid
MONGODB_DB=campusbid
JWT_SECRET=your_jwt_secret_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_APP_NAME=CampusBid
```

Get a free OpenRouter API key at [openrouter.ai](https://openrouter.ai). The app works without one (keyword fallback mode).

> 🔒 **Security**: Never place `OPENROUTER_API_KEY` in frontend code or Vite variables.

---

## 🏗️ Architecture

```
cloudcompanyhackathon/
├── client/           # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context (Auth, Toast)
│   │   ├── lib/          # API client
│   │   └── pages/        # Route pages
│   └── vite.config.js
│
└── server/           # Node.js + Express backend
    ├── src/
    │       ├── data/        # MongoDB connection and data access
    │   ├── middleware/  # JWT auth
    │   └── routes/      # REST API routes
    └── index.js
```

### Backend Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auctions` | List auctions (with filters) |
| GET | `/api/auctions/:id` | Get auction details |
| POST | `/api/auctions` | Create auction |
| POST | `/api/auctions/:id/bids` | Place bid |
| GET | `/api/auctions/:id/bids` | Get bid history |
| POST | `/api/auctions/:id/auto-bid` | Set auto-bid maximum |
| POST | `/api/auctions/:id/decision` | Seller approve/reject |
| POST | `/api/auctions/:id/handover` | Confirm handover |
| GET | `/api/auctions/:id/questions` | Get Q&A |
| POST | `/api/auctions/:id/questions` | Ask question |
| POST | `/api/questions/:id/answer` | Answer question |
| GET | `/api/saved-searches` | Get saved searches |
| POST | `/api/saved-searches` | Save search |
| GET | `/api/notifications` | Get notifications |
| PATCH | `/api/notifications/:id/read` | Mark read |
| POST | `/api/assistant/chat` | AI assistant chat |

---

## ✅ Implemented Features

- [x] User registration and login (JWT, bcrypt)
- [x] Registration restricted to valid `.edu` email addresses
- [x] 6 seeded demo auctions across all categories
- [x] Discover page with featured/ending-soon/recent sections
- [x] Category chips and keyword search
- [x] Filter by category, condition, price range, sort order
- [x] Full auction detail view with image, description, countdown
- [x] Bidding with server-side validation (starting price, min increment)
- [x] Anti-sniping: last-30s bids extend deadline by 60 seconds
- [x] Auto-bid (proxy bidding) with user-confirmed maximum
- [x] Public bid history with auto-bid indication
- [x] Seller cannot bid on own auctions
- [x] Auction lifecycle: ACTIVE → PENDING_SELLER_APPROVAL → RESERVED → SOLD/FAILED_PICKUP
- [x] Seller approve/reject winning bid
- [x] Handover confirmation (SOLD / FAILED_PICKUP)
- [x] Q&A section (buyers ask, sellers answer)
- [x] My Bids page (with winning indicator)
- [x] My Listings page (with pending decision alerts)
- [x] Saved searches with notification matching
- [x] In-app notification center with unread counts
- [x] Browser notification permission flow
- [x] AI assistant via OpenRouter (configurable model)
- [x] Keyword fallback when no API key configured
- [x] AI never fabricates listings — uses real auction data
- [x] OpenRouter API key never exposed to browser
- [x] Responsive layout (mobile sidebar + desktop)
- [x] Toast notifications and loading states
- [x] Socket.IO server (ready for real-time events)

## ⏳ Deferred / Prototype

- [ ] Real-time bid updates via Socket.IO (server ready, client polling fallback active)
- [ ] Image file hosting (uses URL input or base64 preview)
- [x] MongoDB integration with persistent data and first-run demo seed
- [ ] Email notifications
- [ ] College domain validation
- [ ] Automated test suite
- [ ] Production deployment config

---

## 🎯 Hackathon Acceptance Criteria Status

| # | Criteria | Status |
|---|----------|--------|
| 1 | Home page renders without errors | ✅ |
| 2 | Search and filters return appropriate listings | ✅ |
| 3 | Seller can create an auction | ✅ |
| 4 | First bid must meet starting price | ✅ |
| 5 | Subsequent bids must meet minimum increment | ✅ |
| 6 | Invalid and late bids are rejected | ✅ |
| 7 | Bid history updates after accepted bids | ✅ |
| 8 | Countdown reflects actual closing timestamp | ✅ |
| 9 | Final-30s bid extends deadline | ✅ |
| 10 | Closed auctions identify winner or become unsold | ✅ |
| 11 | Seller approval/rejection produce clear outcomes | ✅ |
| 12 | AI searches actual listing data | ✅ |
| 13 | AI bidding requires explicit confirmation | ✅ |
| 14 | Works on desktop and mobile | ✅ |
| 15 | OpenRouter API key never exposed to browser | ✅ |
| 16 | App starts with documented commands | ✅ |

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Lucide React
- **Backend**: Node.js + Express + Socket.IO
- **Auth**: JWT + bcryptjs
- **AI**: OpenRouter Chat Completions API
- **Database**: MongoDB (local by default; configurable with `MONGODB_URI`)

---

*Built for the Cloud Company Hackathon 2024. Good finds. Fair bids. New beginnings.*
