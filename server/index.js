import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { allDb, initializeDb, runDb } from './db.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Transportation accounting service is running.' });
});

app.get('/api/overview', async (req, res) => {
  try {
    const totalVehicles = await allDb('SELECT COUNT(*) as count FROM vehicles');
    const activeDrivers = await allDb("SELECT COUNT(*) as count FROM drivers WHERE status = 'Active'");
    const totalTrips = await allDb('SELECT COUNT(*) as count FROM trips');
    const revenue = await allDb('SELECT COALESCE(SUM(revenue), 0) as total FROM trips');
    const expenses = await allDb('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');
    const payments = await allDb('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE type = "Expense"');

    const totalRevenue = Number(revenue[0]?.total || 0);
    const totalExpense = Number(expenses[0]?.total || 0) + Number(payments[0]?.total || 0);

    res.json({
      totalVehicles: Number(totalVehicles[0]?.count || 0),
      activeDrivers: Number(activeDrivers[0]?.count || 0),
      totalTrips: Number(totalTrips[0]?.count || 0),
      revenue: totalRevenue,
      expenses: totalExpense,
      netProfit: totalRevenue - totalExpense,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to calculate overview metrics.' });
  }
});

app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await allDb('SELECT * FROM vehicles ORDER BY id DESC');
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to fetch vehicles.' });
  }
});

app.post('/api/vehicles', async (req, res) => {
  const { plate_number, type, capacity, status, purchase_date } = req.body;

  if (!plate_number || !type || !capacity || !status || !purchase_date) {
    return res.status(400).json({ error: 'Vehicle information is incomplete.' });
  }

  try {
    const result = await runDb(
      'INSERT INTO vehicles (plate_number, type, capacity, status, purchase_date) VALUES (?, ?, ?, ?, ?)',
      [plate_number, type, capacity, status, purchase_date]
    );
    res.status(201).json({ id: result.id, message: 'Vehicle added successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to add vehicle.' });
  }
});

app.get('/api/drivers', async (req, res) => {
  try {
    const drivers = await allDb('SELECT * FROM drivers ORDER BY id DESC');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to fetch drivers.' });
  }
});

app.post('/api/drivers', async (req, res) => {
  const { name, license_number, phone, status, join_date } = req.body;

  if (!name || !license_number || !phone || !status || !join_date) {
    return res.status(400).json({ error: 'Driver information is incomplete.' });
  }

  try {
    const result = await runDb(
      'INSERT INTO drivers (name, license_number, phone, status, join_date) VALUES (?, ?, ?, ?, ?)',
      [name, license_number, phone, status, join_date]
    );
    res.status(201).json({ id: result.id, message: 'Driver added successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to add driver.' });
  }
});

app.get('/api/trips', async (req, res) => {
  try {
    const trips = await allDb(`
      SELECT t.*, v.plate_number, d.name AS driver_name
      FROM trips t
      LEFT JOIN vehicles v ON v.id = t.vehicle_id
      LEFT JOIN drivers d ON d.id = t.driver_id
      ORDER BY t.id DESC
    `);
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to fetch trips.' });
  }
});

app.post('/api/trips', async (req, res) => {
  const {
    vehicle_id,
    driver_id,
    route,
    cargo_type,
    start_date,
    end_date,
    distance_km,
    fuel_cost,
    revenue,
    notes,
  } = req.body;

  if (!vehicle_id || !driver_id || !route || !cargo_type || !start_date || !end_date || !distance_km || !fuel_cost || !revenue) {
    return res.status(400).json({ error: 'Trip details are incomplete.' });
  }

  try {
    const result = await runDb(
      `INSERT INTO trips (vehicle_id, driver_id, route, cargo_type, start_date, end_date, distance_km, fuel_cost, revenue, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehicle_id, driver_id, route, cargo_type, start_date, end_date, Number(distance_km), Number(fuel_cost), Number(revenue), notes || '']
    );
    res.status(201).json({ id: result.id, message: 'Trip added successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to add trip.' });
  }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await allDb(`
      SELECT e.*, v.plate_number, t.route AS trip_route
      FROM expenses e
      LEFT JOIN vehicles v ON v.id = e.vehicle_id
      LEFT JOIN trips t ON t.id = e.trip_id
      ORDER BY e.id DESC
    `);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to fetch expenses.' });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { category, vehicle_id, trip_id, amount, description, expense_date } = req.body;

  if (!category || !amount || !expense_date) {
    return res.status(400).json({ error: 'Expense details are incomplete.' });
  }

  try {
    const result = await runDb(
      'INSERT INTO expenses (category, vehicle_id, trip_id, amount, description, expense_date) VALUES (?, ?, ?, ?, ?, ?)',
      [category, vehicle_id || null, trip_id || null, Number(amount), description || '', expense_date]
    );
    res.status(201).json({ id: result.id, message: 'Expense added successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to add expense.' });
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const payments = await allDb('SELECT * FROM payments ORDER BY id DESC');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to fetch payments.' });
  }
});

app.post('/api/payments', async (req, res) => {
  const { type, customer_or_vendor, amount, payment_date, reference, notes } = req.body;

  if (!type || !customer_or_vendor || !amount || !payment_date) {
    return res.status(400).json({ error: 'Payment details are incomplete.' });
  }

  try {
    const result = await runDb(
      'INSERT INTO payments (type, customer_or_vendor, amount, payment_date, reference, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [type, customer_or_vendor, Number(amount), payment_date, reference || '', notes || '']
    );
    res.status(201).json({ id: result.id, message: 'Payment added successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to add payment.' });
  }
});

await initializeDb();

const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distDir, 'index.html'));
    }
  });
}

app.listen(port, () => {
  console.log(`Transportation accounting server running at http://localhost:${port}`);
});

export default app;
