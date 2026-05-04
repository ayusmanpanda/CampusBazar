# CampusBazaar

A college-only marketplace web app — students buy, sell, and negotiate items within their campus.

Two interchangeable backends ship with the project. Pick whichever stack you prefer:

- **Node.js + Express** — see [server/](server/)
- **Java 17 + Spring Boot 3.3** — see [server-springboot/](server-springboot/)

Both speak the same REST + Socket.IO contract, so the React frontend works against either one without code changes.

Frontend uses **React + Tailwind**, MongoDB Atlas for data, Cloudinary for images, Redis (optional) for sessions, Gmail SMTP for OTP, and a daily cron for cleanup.

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
├── server/                       # Node.js + Express backend
│   ├── config/                   # Mongo connect
│   ├── models/                   # User, Listing, Chat, Report, Notification
│   ├── middleware/               # auth, admin, upload, validate, error
│   ├── controllers/              # one per resource
│   ├── routes/                   # Express routers
│   ├── socket/                   # Socket.io handlers
│   ├── jobs/                     # node-cron tasks
│   ├── utils/                    # email, cloudinary, redis, jwt, otp
│   └── index.js
├── server-springboot/            # Java 17 + Spring Boot 3 backend
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/campusbazaar/
│       │   ├── CampusBazaarApplication.java
│       │   ├── config/           # SecurityConfig, MongoConfig (TTL), CloudinaryConfig, AppProperties
│       │   ├── model/            # User, Listing, ChatRoom, Message, Report, Notification (Mongo docs)
│       │   ├── repository/       # Spring Data MongoRepository interfaces
│       │   ├── dto/              # request / response records
│       │   ├── service/          # AuthService, ListingService, ChatService, ReportService, AdminService, NotificationService, UserService, EmailService, CloudinaryService
│       │   ├── controller/       # @RestController per resource
│       │   ├── security/         # JwtService, JwtAuthFilter, CurrentUser
│       │   ├── socket/           # Netty Socket.IO server + event handler
│       │   ├── scheduler/        # @Scheduled cron jobs
│       │   └── exception/        # GlobalExceptionHandler, ApiException
│       └── resources/application.yml
├── client/                       # React + Tailwind (works with either backend)
│   ├── src/
│   │   ├── pages/                # Home, Listing, Chat, Profile, Dashboard, Admin, auth
│   │   ├── components/           # ListingCard, ChatWindow, OfferCard, AdminTable, NotificationBell, Navbar
│   │   ├── context/              # AuthContext, SocketContext
│   │   ├── utils/                # api (axios), format helpers
│   │   ├── App.jsx · main.jsx · index.css
│   ├── index.html · vite.config.js · tailwind.config.js · postcss.config.js
│   └── .env.example              # VITE_SOCKET_URL — only needed for the Spring backend
└── .env.example                  # backend env vars (shared by both stacks)
```

---

## Setup — pick one backend

### Common prerequisites
- A MongoDB Atlas cluster (or local MongoDB)
- A Cloudinary account (image hosting)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for OTP email
- An [Upstash Redis](https://upstash.com/) URL (optional — both backends run fine without it)

Copy the env template and fill in the values once — both backends read the same variables:

```bash
cd campusbazaar
cp .env.example server/.env              # if running the Node backend
cp .env.example server-springboot/.env   # if running the Spring Boot backend
```

> Only emails ending in `@COLLEGE_EMAIL_DOMAIN` may sign up.

---

### Option A — Node.js + Express

**Prerequisites:** Node.js 18+

```bash
# install deps
cd campusbazaar/server && npm install
cd ../client && npm install

# terminal 1 — backend
cd campusbazaar/server
npm run dev          # http://localhost:5000

# terminal 2 — frontend
cd campusbazaar/client
npm run dev          # http://localhost:3000
```

Vite proxies both `/api` and `/socket.io` to port 5000, so nothing else to configure.

---

### Option B — Java 17 + Spring Boot 3

**Prerequisites:** Java 17+, Maven 3.9+ (or use the IDE's bundled Maven)

The Spring Boot server reads env vars from a `.env` file (or your shell). On Windows PowerShell:

```powershell
cd campusbazaar\server-springboot
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.*)$') { $env:($matches[1]) = $matches[2] }
}
mvn spring-boot:run                     # http://localhost:5000  (REST)  +  :9092  (Socket.IO)
```

On macOS/Linux:

```bash
cd campusbazaar/server-springboot
export $(grep -v '^#' .env | xargs)
mvn spring-boot:run
```

The Spring backend serves REST on `:5000` and runs **Socket.IO on a separate port (9092)** because the Netty Socket.IO server cannot share Tomcat's port. Tell the React client where to find it:

```bash
# campusbazaar/client/.env
VITE_SOCKET_URL=http://localhost:9092
```

Then start the client as usual:

```bash
cd campusbazaar/client
npm install
npm run dev          # http://localhost:3000
```

> When you switch back to the Node backend, simply remove or comment out `VITE_SOCKET_URL` and restart `npm run dev`.

#### Build a runnable jar

```bash
cd campusbazaar/server-springboot
mvn -DskipTests package
java -jar target/campusbazaar-server-1.0.0.jar
```

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

Same schedule on both backends (Node uses `node-cron`; Spring uses `@Scheduled`):

- daily at midnight (`0 0 0 * * *`) — expire 30-day-old listings, soft-delete users inactive 180+ days, auto-ban users with 5+ reports
- hourly (`0 0 * * * *`) — delete unverified signup accounts older than 15 minutes
- ChatRoom collection has a TTL index on `lastMessageAt` (60 days) — MongoDB removes idle rooms automatically. The Spring backend creates this index in [MongoConfig.java](server-springboot/src/main/java/com/campusbazaar/config/MongoConfig.java) at startup; the Node backend declares it on the schema in [Chat.js](server/models/Chat.js).

---

## Spring Boot ↔ Node — what maps to what

| Concept                | Node                                        | Spring Boot                                                 |
|------------------------|---------------------------------------------|-------------------------------------------------------------|
| HTTP framework         | Express + middleware                        | `spring-boot-starter-web`                                   |
| Mongo driver           | Mongoose                                    | `spring-boot-starter-data-mongodb` (`MongoRepository`)      |
| TTL on chat rooms      | Mongoose `expireAfterSeconds` index         | Programmatic in `MongoConfig` (`indexOps.ensureIndex`)      |
| Auth                   | `jsonwebtoken` + `bcryptjs`                 | `jjwt` + Spring Security `BCryptPasswordEncoder`            |
| Auth filter            | `authMiddleware`                            | `JwtAuthFilter extends OncePerRequestFilter`                |
| Validation             | `express-validator`                         | `@Valid` + Jakarta Bean Validation                          |
| Image upload           | Multer + Cloudinary storage adapter         | `MultipartFile` → Cloudinary Java SDK                       |
| Email (OTP)            | Nodemailer (Gmail SMTP)                     | `spring-boot-starter-mail` + `@Async` send                  |
| Real-time              | `socket.io` server                          | `netty-socketio` (Socket.IO v4 protocol — same client)      |
| Cron                   | `node-cron`                                 | `@Scheduled` + `@EnableScheduling`                          |
| Redis (optional)       | `ioredis`                                   | `spring-boot-starter-data-redis` (`StringRedisTemplate`)    |
| Error handling         | global `errorHandler` middleware            | `@RestControllerAdvice GlobalExceptionHandler`              |
| Admin gate             | `adminMiddleware`                           | `.requestMatchers("/api/admin/**").hasRole("ADMIN")`        |

Endpoint paths, request/response shapes, and Socket.IO event names are identical across both backends.

---

## Production notes

- Build the client with `npm run build` (output in `client/dist/`) and serve it through your reverse proxy or as Express static files.
- Set `NODE_ENV=production` to suppress error stacks in API responses.
- Use a strong, random `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ bytes each).
- Cloudinary uploads go to `campusbazaar/listings/`.
