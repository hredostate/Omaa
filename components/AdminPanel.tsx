import React, { useState, useEffect } from 'react';
import { store } from '../services/mockStore';
import { Driver, Vehicle, Expense, FloatRequest, Trip, TripApprovalStatus } from '../types';
import { 
  User, Truck, FileCheck, Plus, Edit2, Trash2, X, Save, 
  AlertCircle, CheckCircle, XCircle, DollarSign, AlertTriangle 
} from 'lucide-react';

type AdminTab = 'DRIVERS' | 'VEHICLES' | 'APPROVALS';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('DRIVERS');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [floatRequests, setFloatRequests] = useState<FloatRequest[]>([]);

  // Driver form state
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    vehicleId: '',
    floatBalance: 0,
  });

  // Vehicle form state
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: 30,
    status: 'ACTIVE' as Vehicle['status'],
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    setDrivers([...store.getAllDrivers()]);
    setVehicles([...store.getAllVehicles()]);
    setExpenses([...store.getPendingExpenses()]);
    setFloatRequests([...store.getPendingFloatRequests()]);
  };

  const showMessage = (msg: string, isError: boolean = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // ===== DRIVER CRUD HANDLERS =====
  const handleCreateDriver = () => {
    try {
      if (!driverForm.name || !driverForm.phone || !driverForm.vehicleId) {
        showMessage('Please fill all required fields', true);
        return;
      }
      store.createDriver(driverForm);
      showMessage('Driver created successfully');
      setShowDriverForm(false);
      resetDriverForm();
      refreshData();
    } catch (err: any) {
      showMessage(err.message, true);
    }
  };

  const handleUpdateDriver = () => {
    try {
      if (!editingDriver) return;
      store.updateDriver(editingDriver.id, driverForm);
      showMessage('Driver updated successfully');
      setEditingDriver(null);
      setShowDriverForm(false);
      resetDriverForm();
      refreshData();
    } catch (err: any) {
      showMessage(err.message, true);
    }
  };

  const handleDeleteDriver = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      store.deleteDriver(id);
      showMessage('Driver deleted successfully');
      refreshData();
    } catch (err: any) {
      showMessage(err.message, true);
    }
  };

  const openDriverEditForm = (driver: Driver) => {
    setEditingDriver(driver);
    setDriverForm({
      name: driver.name,
      phone: driver.phone,
      vehicleId: driver.vehicleId,
      floatBalance: driver.floatBalance,
    });
    setShowDriverForm(true);
  };

  const resetDriverForm = () => {
    setDriverForm({
      name: '',
      phone: '',
      vehicleId: '',
      floatBalance: 0,
    });
  };

  // ===== VEHICLE CRUD HANDLERS =====
  const handleCreateVehicle = () => {
    try {
      if (!vehicleForm.plateNumber || !vehicleForm.make || !vehicleForm.model) {
        showMessage('Please fill all required fields', true);
        return;
      }
      store.createVehicle(vehicleForm);
      showMessage('Vehicle created successfully');
      setShowVehicleForm(false);
      resetVehicleForm();
      refreshData();
    } catch (err: any) {
      showMessage(err.message, true);
    }
  };

  const handleUpdateVehicle = () => {
    try {
      if (!editingVehicle) return;
      store.updateVehicle(editingVehicle.id, vehicleForm);
      showMessage('Vehicle updated successfully');
      setEditingVehicle(null);
      setShowVehicleForm(false);
      resetVehicleForm();
      refreshData();
    } catch (err: any) {
      showMessage(err.message, true);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      store.deleteVehicle(id);
      showMessage('Vehicle deleted successfully');
      refreshData();
    } catch (err: any) {
      showMessage(err.message, true);
    }
  };

  const openVehicleEditForm = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      plateNumber: vehicle.plateNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      capacity: vehicle.capacity,
      status: vehicle.status,
    });
    setShowVehicleForm(true);
  };

  const resetVehicleForm = () => {
    setVehicleForm({
      plateNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      capacity: 30,
      status: 'ACTIVE',
    });
  };

  // ===== APPROVAL HANDLERS =====
  const handleApproveExpense = (id: string) => {
    store.approveExpense(id);
    showMessage('Expense approved');
    refreshData();
  };

  const handleRejectExpense = (id: string) => {
    if (!window.confirm('Are you sure you want to reject this expense?')) return;
    store.rejectExpense(id);
    showMessage('Expense rejected');
    refreshData();
  };

  const handleApproveFloat = (id: string) => {
    store.approveFloatRequest(id);
    showMessage('Float request approved');
    refreshData();
  };

  const handleRejectFloat = (id: string) => {
    if (!window.confirm('Are you sure you want to reject this float request?')) return;
    store.rejectFloatRequest(id);
    showMessage('Float request rejected');
    refreshData();
  };

  // ===== RENDER FUNCTIONS =====
  const renderDrivers = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Driver Management</h2>
        <button
          onClick={() => {
            setEditingDriver(null);
            resetDriverForm();
            setShowDriverForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold"
        >
          <Plus size={20} /> Add Driver
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Name</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Phone</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Vehicle</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Float Balance</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-800">{driver.name}</td>
                <td className="px-6 py-4 text-slate-600">{driver.phone}</td>
                <td className="px-6 py-4 text-slate-600 font-mono">{driver.vehicleId}</td>
                <td className="px-6 py-4 text-slate-600">₦{driver.floatBalance.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openDriverEditForm(driver)}
                    className="text-blue-600 hover:text-blue-800 p-2"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteDriver(driver.id)}
                    className="text-red-600 hover:text-red-800 p-2 ml-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVehicles = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Vehicle Management</h2>
        <button
          onClick={() => {
            setEditingVehicle(null);
            resetVehicleForm();
            setShowVehicleForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold"
        >
          <Plus size={20} /> Add Vehicle
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Plate Number</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Make/Model</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Year</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Capacity</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">Status</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold text-slate-800">{vehicle.plateNumber}</td>
                <td className="px-6 py-4 text-slate-600">{vehicle.make} {vehicle.model}</td>
                <td className="px-6 py-4 text-slate-600">{vehicle.year}</td>
                <td className="px-6 py-4 text-slate-600">{vehicle.capacity} seats</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    vehicle.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    vehicle.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {vehicle.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openVehicleEditForm(vehicle)}
                    className="text-blue-600 hover:text-blue-800 p-2"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    className="text-red-600 hover:text-red-800 p-2 ml-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Pending Approvals</h2>

      {/* Expenses */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <DollarSign size={20} /> Expense Requests ({expenses.length})
        </h3>
        {expenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            No pending expenses
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="text-lg font-bold text-slate-800">₦{expense.amount.toLocaleString()}</h4>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {expense.type}
                      </span>
                      {expense.fraudAnalysis && expense.fraudAnalysis.length > 0 && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <AlertTriangle size={12} /> {expense.fraudAnalysis.length} Fraud Flag(s)
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mb-2">{expense.description}</p>
                    <p className="text-xs text-slate-400">
                      Trip ID: {expense.tripId} • Driver ID: {expense.driverId} • 
                      {new Date(expense.timestamp).toLocaleString()}
                    </p>
                    {expense.fraudAnalysis && expense.fraudAnalysis.map((flag, idx) => (
                      <div key={idx} className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-bold text-red-700">{flag.message}</p>
                        <p className="text-xs text-red-600">{flag.friendlyExplanation}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApproveExpense(expense.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                      <CheckCircle size={18} /> Approve
                    </button>
                    <button
                      onClick={() => handleRejectExpense(expense.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Float Requests */}
      <div>
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <DollarSign size={20} /> Float Requests ({floatRequests.length})
        </h3>
        {floatRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            No pending float requests
          </div>
        ) : (
          <div className="space-y-4">
            {floatRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-800 mb-2">₦{request.amount.toLocaleString()}</h4>
                    <p className="text-slate-600 mb-2">{request.reason}</p>
                    <p className="text-xs text-slate-400">
                      Driver ID: {request.driverId} • {new Date(request.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApproveFloat(request.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                      <CheckCircle size={18} /> Approve
                    </button>
                    <button
                      onClick={() => handleRejectFloat(request.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderDriverForm = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            {editingDriver ? 'Edit Driver' : 'Create Driver'}
          </h3>
          <button
            onClick={() => {
              setShowDriverForm(false);
              setEditingDriver(null);
              resetDriverForm();
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Name *</label>
            <input
              type="text"
              value={driverForm.name}
              onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Driver name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phone *</label>
            <input
              type="text"
              value={driverForm.phone}
              onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="080XXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Vehicle *</label>
            <select
              value={driverForm.vehicleId}
              onChange={(e) => setDriverForm({ ...driverForm, vehicleId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select vehicle</option>
              {vehicles
                .filter(v => {
                  // Show unassigned vehicles OR the currently assigned vehicle when editing
                  const isAssigned = drivers.some(d => d.vehicleId === v.id && d.id !== editingDriver?.id);
                  return !isAssigned || (editingDriver && editingDriver.vehicleId === v.id);
                })
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} - {v.plateNumber} {drivers.find(d => d.vehicleId === v.id && d.id !== editingDriver?.id) ? '(Assigned)' : ''}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Float Balance (₦)</label>
            <input
              type="number"
              value={driverForm.floatBalance}
              onChange={(e) => {
                const val = e.target.value;
                const parsed = parseFloat(val);
                setDriverForm({ ...driverForm, floatBalance: val === '' ? 0 : (isNaN(parsed) ? 0 : parsed) });
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={editingDriver ? handleUpdateDriver : handleCreateDriver}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Save size={20} /> {editingDriver ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowDriverForm(false);
                setEditingDriver(null);
                resetDriverForm();
              }}
              className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVehicleForm = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            {editingVehicle ? 'Edit Vehicle' : 'Create Vehicle'}
          </h3>
          <button
            onClick={() => {
              setShowVehicleForm(false);
              setEditingVehicle(null);
              resetVehicleForm();
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Plate Number *</label>
            <input
              type="text"
              value={vehicleForm.plateNumber}
              onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="LAG-123-XY"
              disabled={!!editingVehicle}
            />
            {editingVehicle && (
              <p className="text-xs text-slate-500 mt-1">
                Plate number cannot be changed after creation (used as vehicle ID)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Make *</label>
            <input
              type="text"
              value={vehicleForm.make}
              onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Toyota"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Model *</label>
            <input
              type="text"
              value={vehicleForm.model}
              onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Coaster"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Year</label>
            <input
              type="number"
              value={vehicleForm.year}
              onChange={(e) => {
                const val = e.target.value;
                const parsed = parseInt(val);
                setVehicleForm({ ...vehicleForm, year: val === '' ? new Date().getFullYear() : (isNaN(parsed) ? new Date().getFullYear() : parsed) });
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2024"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Capacity</label>
            <input
              type="number"
              value={vehicleForm.capacity}
              onChange={(e) => {
                const val = e.target.value;
                const parsed = parseInt(val);
                setVehicleForm({ ...vehicleForm, capacity: val === '' ? 30 : (isNaN(parsed) ? 30 : parsed) });
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="30"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
            <select
              value={vehicleForm.status}
              onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value as Vehicle['status'] })}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="RETIRED">RETIRED</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={editingVehicle ? handleUpdateVehicle : handleCreateVehicle}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Save size={20} /> {editingVehicle ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowVehicleForm(false);
                setEditingVehicle(null);
                resetVehicleForm();
              }}
              className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Notification Messages */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3">
          <AlertCircle size={24} />
          <span className="font-semibold">{error}</span>
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3">
          <CheckCircle size={24} />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('DRIVERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
              activeTab === 'DRIVERS'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User size={20} /> Drivers
          </button>
          <button
            onClick={() => setActiveTab('VEHICLES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
              activeTab === 'VEHICLES'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck size={20} /> Vehicles
          </button>
          <button
            onClick={() => setActiveTab('APPROVALS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
              activeTab === 'APPROVALS'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCheck size={20} /> Approvals
            {(expenses.length + floatRequests.length > 0) && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {expenses.length + floatRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'DRIVERS' && renderDrivers()}
        {activeTab === 'VEHICLES' && renderVehicles()}
        {activeTab === 'APPROVALS' && renderApprovals()}
      </div>

      {/* Modals */}
      {showDriverForm && renderDriverForm()}
      {showVehicleForm && renderVehicleForm()}
    </div>
  );
};

export default AdminPanel;
