import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dbDir, 'transport.db');
const db = new sqlite3.Database(dbPath);

export const runDb = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });

export const allDb = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });

export const initializeDb = async () => {
  await runDb(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      capacity TEXT NOT NULL,
      status TEXT NOT NULL,
      purchase_date TEXT NOT NULL
    );
  `);

  await runDb(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_number TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      status TEXT NOT NULL,
      join_date TEXT NOT NULL
    );
  `);

  await runDb(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      route TEXT NOT NULL,
      cargo_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      distance_km INTEGER NOT NULL,
      fuel_cost REAL NOT NULL,
      revenue REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY(driver_id) REFERENCES drivers(id)
    );
  `);

  await runDb(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      vehicle_id INTEGER,
      trip_id INTEGER,
      amount REAL NOT NULL,
      description TEXT,
      expense_date TEXT NOT NULL,
      FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY(trip_id) REFERENCES trips(id)
    );
  `);

  await runDb(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      customer_or_vendor TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      reference TEXT,
      notes TEXT
    );
  `);

  const vehicleCount = await allDb('SELECT COUNT(*) as count FROM vehicles');
  if (vehicleCount[0]?.count === 0) {
    await runDb(`
      INSERT INTO vehicles (plate_number, type, capacity, status, purchase_date)
      VALUES
        ('TRK-102', 'Truck', '12 tons', 'Active', '2023-01-12'),
        ('VAN-220', 'Van', '2.5 tons', 'Active', '2022-09-18'),
        ('PICK-410', 'Pickup', '1.2 tons', 'Maintenance', '2021-11-05')
    `);
  }

  const driverCount = await allDb('SELECT COUNT(*) as count FROM drivers');
  if (driverCount[0]?.count === 0) {
    await runDb(`
      INSERT INTO drivers (name, license_number, phone, status, join_date)
      VALUES
        ('Mahmoud Ali', 'LIC-1045', '+966500111222', 'Active', '2021-04-10'),
        ('Nabil Hassan', 'LIC-2098', '+966500777999', 'Active', '2022-02-16'),
        ('Amina Saleh', 'LIC-3032', '+966500453011', 'On leave', '2023-06-01')
    `);
  }

  const tripCount = await allDb('SELECT COUNT(*) as count FROM trips');
  if (tripCount[0]?.count === 0) {
    await runDb(`
      INSERT INTO trips (vehicle_id, driver_id, route, cargo_type, start_date, end_date, distance_km, fuel_cost, revenue, notes)
      VALUES
        (1, 1, 'Jeddah - Riyadh', 'Construction material', '2026-10-01', '2026-10-03', 980, 420.50, 2450.00, 'Fast turnaround and full load'),
        (2, 2, 'Dammam - Khobar', 'Retail stock', '2026-10-05', '2026-10-06', 240, 110.25, 980.00, 'Two-day delivery for retail chain'),
        (3, 1, 'Makkah - Taif', 'Food supplies', '2026-10-07', '2026-10-09', 340, 220.75, 1350.00, 'Cold chain delivery')
    `);
  }

  const expenseCount = await allDb('SELECT COUNT(*) as count FROM expenses');
  if (expenseCount[0]?.count === 0) {
    await runDb(`
      INSERT INTO expenses (category, vehicle_id, trip_id, amount, description, expense_date)
      VALUES
        ('Fuel', 1, 1, 420.50, 'Route fuel consumption', '2026-10-03'),
        ('Maintenance', 3, 3, 680.00, 'Brake and suspension service', '2026-10-08'),
        ('Insurance', 2, 2, 295.00, 'Vehicle renewal', '2026-10-06')
    `);
  }

  const paymentCount = await allDb('SELECT COUNT(*) as count FROM payments');
  if (paymentCount[0]?.count === 0) {
    await runDb(`
      INSERT INTO payments (type, customer_or_vendor, amount, payment_date, reference, notes)
      VALUES
        ('Income', 'North Logistics', 2450.00, '2026-10-04', 'INV-1001', 'Trip settlement'),
        ('Income', 'Retail Market SA', 980.00, '2026-10-06', 'INV-1008', 'Retail delivery payment'),
        ('Expense', 'Al Zamil Fuel', 420.50, '2026-10-03', 'PO-540', 'Fuel purchase')
    `);
  }
};

export default db;
