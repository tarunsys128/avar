import React, { useState } from 'react';
import { Download, TrendingUp, Package, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

// Mock data for Admin Dashboard
const mockOrders = [
  {
    id: 'ORD-1001',
    date: '2026-04-29',
    customerName: 'Rahul Kumar',
    phone: '+919876543210',
    address: '123 Dairy Lane, Milk City',
    product: 'Soft Paneer',
    weight: 5,
    blocks: 1,
    price_per_kg: 240,
    total: 1200,
    paymentMode: 'COD',
    status: 'Delivered',
    staff: 'Staff Member 1'
  },
  {
    id: 'ORD-1002',
    date: '2026-04-29',
    customerName: 'Priya Singh',
    phone: '+919876543211',
    address: '456 Farm Road, Cow Town',
    product: 'Malai Paneer',
    weight: 1,
    blocks: 1,
    price_per_kg: 250,
    total: 250,
    paymentMode: 'COD',
    status: 'Pending',
    staff: 'Unassigned'
  }
];

const AdminDashboard = () => {
  const [orders] = useState(mockOrders);

  // Accounting / Export Feature
  const exportToExcel = () => {
    // Requirements: Excel Fields: Order ID, Date, Customer Name, Mobile, Address, Product, Weight, Blocks, Price/kg, Total, Payment Mode, Status, Staff
    const exportData = orders.map(order => ({
      'Order ID': order.id,
      'Date': order.date,
      'Customer Name': order.customerName,
      'Mobile': order.phone,
      'Address': order.address,
      'Product': order.product,
      'Weight (KG)': order.weight,
      'Blocks': order.blocks,
      'Price/kg': order.price_per_kg,
      'Total': order.total,
      'Payment Mode': order.paymentMode,
      'Status': order.status,
      'Staff': order.staff
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    
    // Generate buffer and save
    XLSX.writeFile(workbook, `AvarDairy_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalRevenue = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;

  return (
    <div className="animate-fade-in pb-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="text-muted">System Overview & Reporting</p>
        </div>
        <button className="btn-primary" onClick={exportToExcel}>
          <Download size={18} />
          Export Orders (Excel)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-muted text-sm font-medium">Revenue (Delivered)</p>
            <p className="text-2xl font-bold">₹{totalRevenue}</p>
          </div>
        </div>
        <div className="card bg-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-muted text-sm font-medium">Total Orders (Today)</p>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </div>
        </div>
        <div className="card bg-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-muted text-sm font-medium">Active Staff</p>
            <p className="text-2xl font-bold">3</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4">Recent Orders (Accounting Preview)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-100 text-sm text-gray-500">
                <th className="pb-3 pr-4 font-medium">Order ID</th>
                <th className="pb-3 px-4 font-medium">Customer</th>
                <th className="pb-3 px-4 font-medium">Product</th>
                <th className="pb-3 px-4 font-medium">Total</th>
                <th className="pb-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-sm">{order.id}</td>
                  <td className="py-3 px-4 text-sm">{order.customerName}</td>
                  <td className="py-3 px-4 text-sm">{order.product} ({order.weight}kg)</td>
                  <td className="py-3 px-4 text-sm font-bold text-primary">₹{order.total}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
