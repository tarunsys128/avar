import React, { useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';

const mockStaff = [
  { id: 'S-001', name: 'Amit Kumar', email: 'amit@avardairy.com', phone: '+919876543001' },
  { id: 'S-002', name: 'Sanjay Singh', email: 'sanjay@avardairy.com', phone: '+919876543002' }
];

const AdminStaff = () => {
  const [staffList] = useState(mockStaff);

  return (
    <div className="animate-fade-in pb-16">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2>Staff Management</h2>
          <p className="text-muted">Manage staff accounts and access.</p>
        </div>
        <button className="btn-primary">
          <UserPlus size={18} /> Add Staff
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-100 text-sm text-gray-500">
                <th className="pb-3 pr-4 font-medium">Staff ID</th>
                <th className="pb-3 px-4 font-medium">Name</th>
                <th className="pb-3 px-4 font-medium">Email</th>
                <th className="pb-3 px-4 font-medium">Phone</th>
                <th className="pb-3 pl-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-sm text-primary">{staff.id}</td>
                  <td className="py-3 px-4 font-medium">{staff.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{staff.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{staff.phone}</td>
                  <td className="py-3 pl-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors inline-flex">
                      <Trash2 size={18} />
                    </button>
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

export default AdminStaff;
