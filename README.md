# CampusBazaar

A college-only marketplace web app — students buy, sell, and negotiate items within their campus.

Built with **React + Tailwind**, **Node + Express**, **MongoDB**, **Socket.io**, **JWT**, **Cloudinary**, **Redis (Upstash)**, **Nodemailer**, and **node-cron**.

---

## Features

- College email signup with OTP verification (Gmail SMTP)
- JWT auth (access + refresh tokens), bcrypt password hashing
- Listings (Books / Electronics / Clothing / Furniture / Services / Other) with up to 5 Cloudinary-hosted images
- Real-time chat per listing (Socket.io)
- In-chat offers with accept / reject / counter flow
- Notifications (live via socket + persisted)
- Reports with auto-ban on threshold (5 reports)
- Admin panel (users, listings, reports)
- Cron jobs: auto-expire 30-day-old listings, soft-delete inactive users (180d), purge unverified signups
- TTL on stale chat rooms (60 days)
- Pagination, search, sort, filtering on the listing feed

---

## Project Structure

```
campusbazaar/
├── server/
│   ├── config/         # Mongo connect
│   ├── models/         # User, Listing, Chat, Report, Notification
│   ├── middleware/     # auth, admin, upload, validate, error
│   ├── controllers/    # one per resource
│   ├── routes/         # Express routers
│   ├── socket/         # Socket.io handlers
│   ├── jobs/           # node-cron tasks
│   ├── utils/          # email, cloudinary, redis, jwt, otp
│   └── index.js        # Express + HTTP + Socket.io entry
├── client/
│   ├── src/
│   │   ├── pages/      # Home, Listing, Chat, Profile, Dashboard, Admin, auth
│   │   ├── components/ # ListingCard, ChatWindow, OfferCard, AdminTable, NotificationBell, Navbar
│   │   ├── context/    # AuthContext, SocketContext
│   │   ├── utils/      # api (axios), format helpers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css   # Tailwind
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── .env.example
```

---

## Setup

### 1. Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)
- A Cloudinary account (image hosting)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for OTP email
- An [Upstash Redis](https://upstash.com/) URL (optional — server works without it)

### 2. Clone & install

```bash
cd campusbazaar

# server deps
cd server && npm install

# client deps
cd ../client && npm install
```

### 3. Configure environment

Copy `.env.example` to `server/.env` and fill in values:

```bash
cp .env.example server/.env
```

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=replace-me
JWT_REFRESH_SECRET=replace-me-too
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
REDIS_URL=rediss://...upstash.io:6379
COLLEGE_EMAIL_DOMAIN=college.edu.in
CLIENT_URL=http://localhost:3000
```

> Only emails ending in `@COLLEGE_EMAIL_DOMAIN` may sign up.

### 4. Run

Open two terminals:

```bash
# terminal 1 — backend
cd server
npm run dev          # starts on http://localhost:5000
```

```bash
# terminal 2 — frontend
cd client
npm run dev          # starts on http://localhost:3000
```

The Vite dev server proxies `/api` and `/socket.io` to the backend, so no extra config is required.

---

## API Routes

### Auth
- `POST /api/auth/signup` — create unverified account, email OTP
- `POST /api/auth/verify-otp` — confirm signup
- `POST /api/auth/login` — issue access + refresh tokens
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### Listings
- `GET    /api/listings` — `?q&category&condition&minPrice&maxPrice&sort&page&limit`
- `POST   /api/listings` — `multipart/form-data` with `images[]` (max 5)
- `GET    /api/listings/:id`
- `PUT    /api/listings/:id`
- `DELETE /api/listings/:id`
- `POST   /api/listings/:id/views`
- `GET    /api/listings/me/mine`

### Chats & Offers
- `POST /api/chats` — body `{ listingId }`
- `GET  /api/chats`
- `GET  /api/chats/:id/messages`
- `POST /api/chats/:id/offer`
- `PUT  /api/chats/:id/offer/:offerId` — `{ action: accept|reject|counter, counterPrice? }`

### Reports / Admin / Notifications / Users
- `POST /api/reports`
- `GET  /api/admin/users | /listings | /reports`
- `PUT  /api/admin/reports/:id`
- `PUT  /api/admin/users/:id/ban`
- `GET  /api/notifications`
- `PUT  /api/notifications/:id/read`
- `PUT  /api/notifications/read-all`
- `GET  /api/users/:id`

---

## Socket.io Events (client ↔ server)

| Event              | Direction      | Payload |
|--------------------|----------------|---------|
| `joinRoom`         | client → server| `chatRoomId` |
| `leaveRoom`        | client → server| `chatRoomId` |
| `sendMessage`      | client → server| `{ chatRoomId, text }` |
| `sendOffer`        | client → server| `{ chatRoomId, offerPrice, text? }` |
| `offerResponse`    | client → server| `{ chatRoomId, offerId, action, counterPrice? }` |
| `typing`           | client → server| `{ chatRoomId, isTyping }` |
| `newMessage`       | server → client| `{ chatRoomId, message }` |
| `offerUpdated`     | server → client| `{ chatRoomId, offerId, status, counterMessage? }` |
| `typing`           | server → client| `{ chatRoomId, userId, isTyping }` |
| `onlineStatus`     | server → all   | `{ userId, online }` |
| `newNotification`  | server → user  | `{ type, ... }` |

The client connects with `auth.token` set to the access token. Connections without a valid JWT are rejected.

---

## Cron Jobs

- `0 0 * * *` — daily at midnight: expire 30-day-old listings, soft-delete users inactive 180+ days, auto-ban users with 5+ reports.
- `0 * * * *` — hourly: delete unverified signup accounts older than 15 minutes.
- ChatRoom collection has a TTL index on `lastMessageAt` (60 days) — MongoDB removes idle rooms automatically.

---

## Production notes

- Build the client with `npm run build` (output in `client/dist/`) and serve it through your reverse proxy or as Express static files.
- Set `NODE_ENV=production` to suppress error stacks in API responses.
- Use a strong, random `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ bytes each).
- Cloudinary uploads go to `campusbazaar/listings/`.
