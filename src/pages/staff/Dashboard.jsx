import React, { useState } from 'react';
import { Package, Clock, CheckCircle } from 'lucide-react';

// Mock data for UI development
const mockOrders = [
  {
    id: 'ORD-1001',
    customerName: 'Rahul Kumar',
    phone: '+919876543210',
    total: 1200,
    status: 'Pending',
    time: '10:30 AM',
    items: [
      { name: 'Soft Paneer', weight: 5, blocks: 1 }
    ],
    address: '123 Dairy Lane, Milk City'
  },
  {
    id: 'ORD-1002',
    customerName: 'Priya Singh',
    phone: '+919876543211',
    total: 250,
    status: 'Preparing',
    time: '09:15 AM',
    items: [
      { name: 'Malai Paneer', weight: 1, blocks: 1 }
    ],
    address: '456 Farm Road, Cow Town'
  }
];

const StaffDashboard = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [filter, setFilter] = useState('Today'); // 'Today' or 'All'

  const updateStatus = (orderId, newStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    // In real app, this updates Firestore document
  };

  const getNextStatus = (current) => {
    switch (current) {
      case 'Pending': return 'Accepted';
      case 'Accepted': return 'Preparing';
      case 'Preparing': return 'Ready';
      case 'Ready': return 'Delivered';
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    return `badge badge-${status.toLowerCase()}`;
  };

  const stats = {
    pending: orders.filter(o => o.status === 'Pending').length,
    completed: orders.filter(o => o.status === 'Delivered').length,
    active: orders.filter(o => ['Accepted', 'Preparing', 'Ready'].includes(o.status)).length
  };

  return (
    <div className="animate-fade-in pb-16">
      <div className="flex justify-between items-center mb-6">
        <h2>Staff Dashboard</h2>
        <div className="flex gap-2">
          <button 
            className={`px-4 py-1 rounded-full text-sm font-medium ${filter === 'Today' ? 'bg-primary text-white' : 'bg-white text-gray-600 border'}`}
            onClick={() => setFilter('Today')}
          >
            Today
          </button>
          <button 
            className={`px-4 py-1 rounded-full text-sm font-medium ${filter === 'All' ? 'bg-primary text-white' : 'bg-white text-gray-600 border'}`}
            onClick={() => setFilter('All')}
          >
            All
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card bg-white flex flex-col items-center justify-center py-6">
          <div className="text-3xl font-bold text-orange-500">{stats.pending}</div>
          <div className="text-sm text-muted font-medium mt-1">Pending</div>
        </div>
        <div className="card bg-white flex flex-col items-center justify-center py-6">
          <div className="text-3xl font-bold text-blue-500">{stats.active}</div>
          <div className="text-sm text-muted font-medium mt-1">Active</div>
        </div>
        <div className="card bg-white flex flex-col items-center justify-center py-6">
          <div className="text-3xl font-bold text-green-500">{stats.completed}</div>
          <div className="text-sm text-muted font-medium mt-1">Completed</div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {orders.map(order => {
          const nextStatus = getNextStatus(order.status);
          
          return (
            <div key={order.id} className="card relative overflow-hidden">
              {/* Highlight bar for new pending orders */}
              {order.status === 'Pending' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
              )}
              
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold">{order.id}</h3>
                      <p className="text-sm text-muted flex items-center gap-1">
                        <Clock size={14} /> {order.time} • {order.customerName}
                      </p>
                    </div>
                    <span className={getStatusBadge(order.status)}>{order.status}</span>
                  </div>

                  <div className="bg-gray-50 rounded-md p-3 mb-3 border border-gray-100">
                    <p className="text-sm font-medium mb-1">Order Details:</p>
                    <ul className="text-sm text-gray-700">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{item.blocks}x {item.name} ({item.weight}KG)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Address:</span> {order.address}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Phone:</span> {order.phone}
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end md:w-48 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4">
                  <div className="text-right w-full mb-4 md:mb-0">
                    <p className="text-xs text-muted mb-1">Total Amount (COD)</p>
                    <p className="font-bold text-xl text-primary">₹{order.total}</p>
                  </div>
                  
                  {nextStatus && (
                    <button 
                      className="btn-primary w-full text-sm py-2"
                      onClick={() => updateStatus(order.id, nextStatus)}
                    >
                      Mark as {nextStatus}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaffDashboard;
