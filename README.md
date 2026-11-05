# AeroCampus

AeroCampus is an aerospace education, aviation, space-science, and career-guidance
website. The current application uses a React/Vite frontend and an Express API backed by
PostgreSQL; it does not use MongoDB. Public content is loaded from the API. Seeded
articles are educational examples, not verified reporting or current news.

## Requirements

- Node.js 20 or newer and npm
- PostgreSQL 14 or newer



````

Install and start the backend:

```powershell
npm install
npm run migrate
npm run seed
npm run dev
```


In a second PowerShell window, start the frontend:

```powershell
Set-Location .\AERO_FRONT
npm install
npm run dev
```


In another PowerShell window, start the separate administrator workspace:

```powershell
Set-Location .\AERO_ADMIN
npm install
npm run dev
```

Open `http://localhost:5174/admin/login`. The admin app proxies `/api` requests to the
backend and links back to `http://localhost:5173` by default. Set
`VITE_PUBLIC_SITE_URL` when the public site is hosted at a different URL.

## First administrator


Set-Location .\AERO_BACK
npm run admin:create -- --name "AeroCampus Admin" --email "admin@example.com"
```

The password is bcrypt-hashed before storage. Never pass it as a command-line argument
or store it in source control. New administrator accounts must change this initial
password after their first sign-in. Existing administrator accounts are not forced to
change passwords by this migration. Open `/admin/login` on the frontend to sign in.

## API

All routes are under `/api/v1`. Responses use a consistent `success`, `data`, `meta`, or
`error` JSON shape.

### Public routes

- `GET /health` — database readiness.
- `GET /posts?page=1&limit=9&search=flight&category=aviation` — published posts, search,
  category filter, newest-first ordering, and validated pagination.
- `GET /posts/:slug` — a published post; drafts and future-dated posts return 404.
- `GET /categories` — categories represented by public posts.
- `POST /contact` — validates and stores a contact message.

### Administrator routes

- `POST /auth/login` — admin login, limited to 10 attempts per 15-minute window.
- `GET /auth/me`, `POST /auth/password`, and `POST /auth/logout`.
- `GET /admin/dashboard`, `/admin/posts`, `/admin/posts/:id`, and
  `/admin/categories`.
- `POST`, `PUT`, and `DELETE` routes for `/admin/posts` and `/admin/categories`.
- `POST /admin/uploads` — authenticated cover-image upload (AVIF, JPEG, PNG, or WebP,
  maximum 8 MB).
- `POST /contact` — limited to 5 submissions per 15 minutes per client IP.



## Tests and builds

Backend API/unit tests use test doubles and do not require a live database:

```powershell
Set-Location .\AERO_BACK
npm test
npm audit
```

