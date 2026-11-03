# AeroCampus

AeroCampus is an aerospace education, aviation, space-science, and career-guidance
website. The current application uses a React/Vite frontend and an Express API backed by
PostgreSQL; it does not use MongoDB. Public content is loaded from the API. Seeded
articles are educational examples, not verified reporting or current news.

## Requirements

- Node.js 20 or newer and npm
- PostgreSQL 14 or newer

## Local setup (Windows PowerShell)

Create the PostgreSQL database if needed:

```powershell
createdb -U postgres aerocampus
```

If `createdb` is not on `PATH`, run it using the installed PostgreSQL binary path, for
example:

````

Configure the backend without committing credentials:

```powershell
Set-Location .\AERO_BACK
Copy-Item .env.example .env
````

Set `DATABASE_URL` in `AERO_BACK\.env` to a PostgreSQL connection URL. For local
development, `DATABASE_SSL=false` is appropriate when PostgreSQL is local and does not
use TLS. Never put database credentials in frontend variables or commit `.env`.

Required and optional backend variables:

| Variable                                | Purpose                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                          | PostgreSQL URL for the API and local setup scripts. Required.                                       |
| `DATABASE_MIGRATION_URL`                | Optional locally; required for production migrations and intended for a separate schema-owner role. |
| `DATABASE_SSL`                          | `true` or `false`. Must be `true` in production; TLS certificates are verified.                     |
| `DATABASE_SSL_REJECT_UNAUTHORIZED`      | Optional certificate verification override; set to `false` only when the hosted database uses a self-signed certificate. |
| `DATABASE_POOL_MAX`                     | Optional pool size from 1 to 50; defaults to 10.                                                    |
| `SESSION_SECRET`                        | Production session/CSRF signing secret, at least 32 characters.                                     |
| `CLIENT_URL`                            | Comma-separated frontend origins allowed by CORS, e.g. `http://localhost:5173`.                     |
| `PORT`                                  | API port; defaults to 5000.                                                                         |

Contact messages are saved to PostgreSQL and can be reviewed from the authenticated
admin dashboard under **Contact messages**. No email service is required.

Generate a strong session secret in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Install and start the backend:

```powershell
npm install
npm run migrate
npm run seed
npm run dev
```

The API is available at `http://localhost:5000`. For local development, set
`CLIENT_URL=http://localhost:5173,http://localhost:5174` so the backend accepts both
the public website and the separate admin workspace. Migrations are versioned SQL files in
`AERO_BACK/migrations`; applied names are recorded in `schema_migrations`. The seed
script is idempotent and creates clearly labelled sample articles and categories.
The admin article editor uploads AVIF, JPEG, PNG, and WebP cover images (up to 8 MB);
uploaded files are stored in `AERO_BACK/uploads`, so keep that directory on persistent
storage when deploying the API. Sample article covers and the site’s built-in images use
the local files in `AERO_FRONT/src/assets`.

In a second PowerShell window, start the frontend:

```powershell
Set-Location .\AERO_FRONT
npm install
npm run dev
```

Open `http://localhost:5173`. For a separate API host, configure the frontend build-time
variable `VITE_API_URL` to the API base URL ending in `/api/v1`; otherwise the frontend
uses the same-origin `/api/v1` path.

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

There is no public registration endpoint. After migrations are applied, create an
administrator interactively from `AERO_BACK`; the script prompts for a password twice
without echoing it and requires at least 14 characters:

```powershell
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

Admin routes require an administrator session. Mutating routes also require the
session-bound `X-CSRF-Token`; cookie-authenticated writes reject untrusted `Origin`
headers. New administrators must change their initial password before using the admin
workspace; the endpoint requires the current password and a different password of at
least 14 characters. Article content is rendered as React text, not injected HTML.
Cover images may use HTTPS URLs, known bundled-asset keys, or the API's uploaded-image
paths. Public API queries exclude drafts and posts scheduled for the future.

Seeded posts are marked in the database as `is_sample` and labeled in the public UI as
educational sample content. They are not current news, verified reporting, job openings,
salary claims, or scholarship announcements.

## Database permissions and production deployment

Production hosting, DNS, TLS termination, and managed PostgreSQL provisioning are
operator responsibilities; this project has not been deployed. Before serving traffic:

1. Set `NODE_ENV=production`, `DATABASE_SSL=true`, a strong private `SESSION_SECRET`,
   `CLIENT_URL` to the exact HTTPS frontend origin(s), and a production `DATABASE_URL`.
2. Configure the API behind HTTPS. The session cookie is `HttpOnly`, `SameSite=Strict`,
   and `Secure` in production. Keep frontend and API origin configuration aligned.
3. Use separate database identities. The runtime `DATABASE_URL` role should have only
   the DML rights the application needs on its tables and sequences; it should not own
   the schema or create/alter/drop objects. A schema-owner/migration role belongs only
   in `DATABASE_MIGRATION_URL` and should be used for `npm run migrate`, not by the
   running API. Provision and verify these grants with the database administrator;
   application code cannot enforce hosted database permissions.
4. Run migrations before starting the API. Production migration execution fails unless
   `DATABASE_MIGRATION_URL` is set. Do not run seed scripts against production unless
   intentionally importing the labeled sample content.
5. Create the initial admin through a controlled provisioning process. The one-off
   `admin:create` script uses `DATABASE_URL`, so run it with an appropriately limited
   provisioning connection capable of inserting the admin record, not the schema-owner
   migration account.
6. Configure backups, monitoring, secret rotation, a shared rate-limit store for
   multi-instance deployments, and appropriate contact-message retention. The current
   login limiter is in-memory per process; it is not a distributed rate limiter.

No deployment or live database mutation is performed by the QA instructions below.

## Tests and builds

Backend API/unit tests use test doubles and do not require a live database:

```powershell
Set-Location .\AERO_BACK
npm test
npm audit
```

Frontend production build and dependency audit:

```powershell
Set-Location .\AERO_FRONT
npm run build
npm audit
```

The frontend currently has no automated test or lint script. Use the routes `/`,
`/articles`, `/articles/:slug`, `/aerospace-engineering`, `/about`, `/contact`,
`/admin/login`, and an unknown URL for manual browser checks. Newly created admins
should also be checked through `/admin/change-password`. At narrow widths, verify the
mobile navigation, article filters, forms, and admin tables.
