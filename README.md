# Book My Ticket Hackathon

A full-stack movie ticket booking app with:
- Movie/showtime seat selection
- JWT auth (signup/login)
- Hold + confirm booking flow
- My Bookings + cancel booking
- Seat reset script for show turnover

---

## Project Structure

```text
book-my-ticket-hackathon/
├── backend/
│   ├── config/
│   │   └── db.mjs
│   ├── controllers/
│   │   ├── authController.mjs
│   │   └── bookingController.mjs
│   ├── database/
│   │   └── schema.sql
│   ├── middleware/
│   │   └── authUser.mjs
│   ├── routes/
│   │   ├── authRoutes.mjs
│   │   └── bookingRoutes.mjs
│   ├── index.mjs
│   ├── migrate.mjs
│   ├── run-migration.mjs
│   ├── reset-seats.mjs
│   ├── package.json
│   └── docker-compose.yml
├── frontend/
│   ├── public/
│   │   └── assets/
│   │       ├── bhootbangla.jpg
│   │       ├── dacoit.webp
│   │       ├── dhurandhar2.webp
│   │       └── projecthailmary.jpg
│   ├── index.html
│   ├── main.js
│   ├── vite.config.js
│   └── package.json
├── render.yaml
└── README.md
```

---

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL (local or hosted)

---

## Environment Variables (Backend)

Create `backend/.env` (or update existing):

```env
# Option 1: hosted DB
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Option 2: local DB fields
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=booking_db

# Auth
JWT_SECRET=your_super_secret_key

# Optional
NODE_ENV=development
PORT=8080
```

---

## Setup & Run

### 1) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Run migration (create/seed tables)

```bash
cd backend
node migrate.mjs
```

### 3) Start backend

```bash
cd backend
npm start
```

### 4) Start frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Vite will print the local URL (usually `http://localhost:5173`).

---

## Useful Commands

### Reset all seats + clear bookings

```bash
cd backend
npm run reset:seats
```

### Frontend production build

```bash
cd frontend
npm run build
npm run preview
```

---

## API Overview

### Auth
- `POST /auth/register`
- `POST /auth/login`

### Seats
- `GET /seats?movie=<movie>&time=<slot>`

### Booking (protected)
- `POST /book/hold/:id?movie=<movie>&time=<slot>`
- `POST /book/release/:id?movie=<movie>&time=<slot>`
- `POST /book/confirm?movie=<movie>&time=<slot>`
- `GET /book/my-bookings`
- `DELETE /book/cancel/:bookingId`

### Legacy booking (no auth)
- `PUT /book/legacy/:id/:name?movie=<movie>&time=<slot>`

---

## Screenshots / Demo Images

> Add your images in `frontend/public/assets` or a `docs/` folder and replace paths below.

```md
![Auth Screen](./frontend/public/assets/auth.png)
![Seat Selection](./frontend/public/assets/seats.png)
![My Bookings](./frontend/public/assets/bookings.png)`
![Seat Holding](./frontend/public/assets/hold.png)`
````

---

## Notes

- Movie keys expected by backend: `dhurandhar`, `boothbangla`, `dacoit`, `hailmary`
- Time slots: `9am`, `2pm`, `7pm`
- Max 5 seats per user per movie+showtime (enforced in backend)
