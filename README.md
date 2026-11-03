# G-Sync

A mobile-first, installable automated-trading dashboard built with Next.js, Bootstrap, and Neon Postgres. The dashboard currently uses simulated data only: it does not connect to an exchange or place trades.

## Run locally

Requirements: Node.js 20 or newer.

1. Install packages with `npm install`.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to your Neon connection string.
3. Set `AUTH_SECRET` to a random secret of at least 32 characters (for example, generate one with `openssl rand -base64 32`).
4. Run `db/schema.sql` in the Neon SQL Editor to create the users table.
5. Start the app with `npm run dev` and open `http://localhost:3000`.

Create an account in the app to receive a unique ID such as `G-3666666686386`. Passwords are hashed before they are stored; sign-in uses an HTTP-only session cookie.

## Install on a phone

Deploy over HTTPS, open the site in a supported mobile browser, then choose **Add to Home Screen** or **Install app** from the browser menu. The app includes a web manifest and service worker for its app shell.

Run `npm run typecheck` and `npm run build` to validate the project.

## Deploy to Heroku

The repository includes a `Procfile` and supports Node.js 20 through 24. Create a Heroku app, configure `DATABASE_URL` and `AUTH_SECRET` as Heroku config vars, then push the `main` branch to the Heroku remote. Heroku builds the Next.js app and starts it with `npm start`.

```sh
heroku login
heroku create <app-name>
heroku config:set DATABASE_URL="<neon-connection-string>" AUTH_SECRET="<random-secret>" --app <app-name>
git push heroku main
```