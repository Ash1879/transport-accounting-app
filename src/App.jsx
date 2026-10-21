import { useEffect, useMemo, useState } from 'react';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const emptyVehicle = {
  plate_number: '',
  type: 'Truck',
  capacity: '',
  status: 'Active',
  purchase_date: '',
};

const emptyDriver = {
  name: '',
  license_number: '',
  phone: '',
  status: 'Active',
  join_date: '',
};

const emptyTrip = {
  vehicle_id: '',
  driver_id: '',
  route: '',
  cargo_type: '',
  start_date: '',
  end_date: '',
  distance_km: '',
  fuel_cost: '',
  revenue: '',
  notes: '',
};

const emptyExpense = {
  category: 'Fuel',
  vehicle_id: '',
  trip_id: '',
  amount: '',
  description: '',
  expense_date: '',
};

const emptyPayment = {
  type: 'Income',
  customer_or_vendor: '',
  amount: '',
  payment_date: '',
  reference: '',
  notes: '',
};

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(errorDetails || 'Request failed');
  }

  return response.json();
}

export default function App() {
  const [overview, setOverview] = useState({
    totalVehicles: 0,
    activeDrivers: 0,
    totalTrips: 0,
    netProfit: 0,
    revenue: 0,
    expenses: 0,
  });
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle);
  const [driverForm, setDriverForm] = useState(emptyDriver);
  const [tripForm, setTripForm] = useState(emptyTrip);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [overviewData, vehiclesData, driversData, tripsData, expensesData, paymentsData] =
        await Promise.all([
          fetchJson('/api/overview'),
          fetchJson('/api/vehicles'),
          fetchJson('/api/drivers'),
          fetchJson('/api/trips'),
          fetchJson('/api/expenses'),
          fetchJson('/api/payments'),
        ]);

      setOverview(overviewData);
      setVehicles(vehiclesData);
      setDrivers(driversData);
      setTrips(tripsData);
      setExpenses(expensesData);
      setPayments(paymentsData);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const vehicleOptions = useMemo(
    () => vehicles.map((vehicle) => ({ label: `${vehicle.plate_number} (${vehicle.type})`, value: vehicle.id })),
    [vehicles]
  );

  const driverOptions = useMemo(
    () => drivers.map((driver) => ({ label: `${driver.name} - ${driver.license_number}`, value: driver.id })),
    [drivers]
  );

  const handleVehicleSubmit = async (event) => {
    event.preventDefault();
    try {
      await fetchJson('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicleForm),
      });
      setVehicleForm(emptyVehicle);
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Failed to add vehicle');
    }
  };

  const handleDriverSubmit = async (event) => {
    event.preventDefault();
    try {
      await fetchJson('/api/drivers', {
        method: 'POST',
        body: JSON.stringify(driverForm),
      });
      setDriverForm(emptyDriver);
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Failed to add driver');
    }
  };

  const handleTripSubmit = async (event) => {
    event.preventDefault();
    try {
      await fetchJson('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          ...tripForm,
          distance_km: Number(tripForm.distance_km),
          fuel_cost: Number(tripForm.fuel_cost),
          revenue: Number(tripForm.revenue),
        }),
      });
      setTripForm(emptyTrip);
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Failed to add trip');
    }
  };

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    try {
      await fetchJson('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...expenseForm,
          amount: Number(expenseForm.amount),
        }),
      });
      setExpenseForm(emptyExpense);
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Failed to add expense');
    }
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    try {
      await fetchJson('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          ...paymentForm,
          amount: Number(paymentForm.amount),
        }),
      });
      setPaymentForm(emptyPayment);
      await loadDashboard();
    } catch (err) {
      setError(err.message || 'Failed to add payment');
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Transport accounting</p>
          <h1>Fleet & Logistics Finance</h1>
        </div>
        <button className="primary-button" onClick={loadDashboard}>
          Refresh
        </button>
      </header>

      {error ? <div className="alert error">{error}</div> : null}

      {loading ? (
        <div className="loading">Loading dashboard…</div>
      ) : (
        <>
          <section className="stats-grid">
            <div className="stat-card">
              <span>Vehicles</span>
              <strong>{overview.totalVehicles}</strong>
              <small>Registered assets</small>
            </div>
            <div className="stat-card">
              <span>Active drivers</span>
              <strong>{overview.activeDrivers}</strong>
              <small>Ready for routes</small>
            </div>
            <div className="stat-card">
              <span>Trips</span>
              <strong>{overview.totalTrips}</strong>
              <small>Completed this cycle</small>
            </div>
            <div className="stat-card accent">
              <span>Net profit</span>
              <strong>{formatCurrency(overview.netProfit)}</strong>
              <small>{formatCurrency(overview.revenue)} revenue / {formatCurrency(overview.expenses)} expenses</small>
            </div>
          </section>

          <section className="grid two-columns">
            <div className="panel">
              <div className="panel-header">
                <h2>New vehicle</h2>
              </div>
              <form onSubmit={handleVehicleSubmit} className="stack-form">
                <input
                  value={vehicleForm.plate_number}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value })}
                  placeholder="Plate number"
                  required
                />
                <select
                  value={vehicleForm.type}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
                >
                  <option>Truck</option>
                  <option>Van</option>
                  <option>Pickup</option>
                  <option>Trailer</option>
                </select>
                <input
                  value={vehicleForm.capacity}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                  placeholder="Capacity (kg or tons)"
                  required
                />
                <select
                  value={vehicleForm.status}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>Maintenance</option>
                  <option>Inactive</option>
                </select>
                <input
                  type="date"
                  value={vehicleForm.purchase_date}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, purchase_date: e.target.value })}
                  required
                />
                <button className="primary-button" type="submit">Save vehicle</button>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>New driver</h2>
              </div>
              <form onSubmit={handleDriverSubmit} className="stack-form">
                <input
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                  placeholder="Driver name"
                  required
                />
                <input
                  value={driverForm.license_number}
                  onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                  placeholder="License number"
                  required
                />
                <input
                  value={driverForm.phone}
                  onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                  placeholder="Phone"
                  required
                />
                <select
                  value={driverForm.status}
                  onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>On leave</option>
                  <option>Inactive</option>
                </select>
                <input
                  type="date"
                  value={driverForm.join_date}
                  onChange={(e) => setDriverForm({ ...driverForm, join_date: e.target.value })}
                  required
                />
                <button className="primary-button" type="submit">Save driver</button>
              </form>
            </div>
          </section>

          <section className="grid three-columns">
            <div className="panel">
              <div className="panel-header">
                <h2>Trip entry</h2>
              </div>
              <form onSubmit={handleTripSubmit} className="stack-form">
                <select
                  value={tripForm.vehicle_id}
                  onChange={(e) => setTripForm({ ...tripForm, vehicle_id: e.target.value })}
                  required
                >
                  <option value="">Select vehicle</option>
                  {vehicleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={tripForm.driver_id}
                  onChange={(e) => setTripForm({ ...tripForm, driver_id: e.target.value })}
                  required
                >
                  <option value="">Select driver</option>
                  {driverOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  value={tripForm.route}
                  onChange={(e) => setTripForm({ ...tripForm, route: e.target.value })}
                  placeholder="Route"
                  required
                />
                <input
                  value={tripForm.cargo_type}
                  onChange={(e) => setTripForm({ ...tripForm, cargo_type: e.target.value })}
                  placeholder="Cargo type"
                  required
                />
                <div className="inline-fields">
                  <input
                    type="date"
                    value={tripForm.start_date}
                    onChange={(e) => setTripForm({ ...tripForm, start_date: e.target.value })}
                    required
                  />
                  <input
                    type="date"
                    value={tripForm.end_date}
                    onChange={(e) => setTripForm({ ...tripForm, end_date: e.target.value })}
                    required
                  />
                </div>
                <div className="inline-fields">
                  <input
                    value={tripForm.distance_km}
                    onChange={(e) => setTripForm({ ...tripForm, distance_km: e.target.value })}
                    placeholder="Distance km"
                    type="number"
                    min="0"
                    required
                  />
                  <input
                    value={tripForm.fuel_cost}
                    onChange={(e) => setTripForm({ ...tripForm, fuel_cost: e.target.value })}
                    placeholder="Fuel cost"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <input
                  value={tripForm.revenue}
                  onChange={(e) => setTripForm({ ...tripForm, revenue: e.target.value })}
                  placeholder="Revenue"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
                <textarea
                  value={tripForm.notes}
                  onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })}
                  placeholder="Trip notes"
                  rows="3"
                />
                <button className="primary-button" type="submit">Add trip</button>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>Expense</h2>
              </div>
              <form onSubmit={handleExpenseSubmit} className="stack-form">
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  <option>Fuel</option>
                  <option>Maintenance</option>
                  <option>Insurance</option>
                  <option>Route fee</option>
                  <option>Other</option>
                </select>
                <select
                  value={expenseForm.vehicle_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })}
                >
                  <option value="">Select vehicle</option>
                  {vehicleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={expenseForm.trip_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, trip_id: e.target.value })}
                >
                  <option value="">Select trip</option>
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.route}
                    </option>
                  ))}
                </select>
                <input
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="Amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
                <input
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                  required
                />
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Description"
                  rows="3"
                />
                <button className="primary-button" type="submit">Add expense</button>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>Payment</h2>
              </div>
              <form onSubmit={handlePaymentSubmit} className="stack-form">
                <select
                  value={paymentForm.type}
                  onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                >
                  <option>Income</option>
                  <option>Expense</option>
                </select>
                <input
                  value={paymentForm.customer_or_vendor}
                  onChange={(e) => setPaymentForm({ ...paymentForm, customer_or_vendor: e.target.value })}
                  placeholder="Customer / Vendor"
                  required
                />
                <input
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="Amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  required
                />
                <input
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="Invoice / Reference"
                />
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Notes"
                  rows="3"
                />
                <button className="primary-button" type="submit">Add payment</button>
              </form>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Fleet overview</h2>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Plate</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.plate_number}</td>
                      <td>{vehicle.type}</td>
                      <td>{vehicle.capacity}</td>
                      <td>{vehicle.status}</td>
                      <td>{formatDate(vehicle.purchase_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid two-columns">
            <div className="panel">
              <div className="panel-header">
                <h2>Drivers</h2>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>License</th>
                      <th>Phone</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((driver) => (
                      <tr key={driver.id}>
                        <td>{driver.name}</td>
                        <td>{driver.license_number}</td>
                        <td>{driver.phone}</td>
                        <td>{driver.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>Trips</h2>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Route</th>
                      <th>Distance</th>
                      <th>Fuel</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((trip) => (
                      <tr key={trip.id}>
                        <td>{trip.route}</td>
                        <td>{trip.distance_km} km</td>
                        <td>{formatCurrency(trip.fuel_cost)}</td>
                        <td>{formatCurrency(trip.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="grid two-columns">
            <div className="panel">
              <div className="panel-header">
                <h2>Expenses</h2>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{expense.category}</td>
                        <td>{formatCurrency(expense.amount)}</td>
                        <td>{formatDate(expense.expense_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>Payments</h2>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Partner</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.type}</td>
                        <td>{payment.customer_or_vendor}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td>{formatDate(payment.payment_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
