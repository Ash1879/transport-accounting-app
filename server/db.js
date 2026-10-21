# Transport Accounting Web Application

A lightweight transportation accounting dashboard built with React + Node.js and SQLite. It helps logistics businesses track vehicles, drivers, trips, fuel, maintenance expenses, and payments.

## Features

- Vehicle management
- Driver management
- Trip registration and tracking
- Expense logging (fuel, maintenance, insurance, route fees)
- Payment tracking
- Finance summary and dashboard overview
- SQLite database with seed data

## Tech stack

- React + Vite
- Node.js + Express
- SQLite

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development servers:

   ```bash
   npm run dev
   ```

3. Open the app in the browser:

   - Frontend: http://localhost:5173
   - API: http://localhost:4000/api

## Production build

```bash
npm run build
npm run start
```

## Project structure

- `src/` – React frontend
- `server/` – Express API and SQLite logic
- `data/` – SQLite database file output

## Notes

The app includes sample data for a ready-to-test transportation accounting workflow.
