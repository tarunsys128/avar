import React, { useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';

const mockProducts = [
  { id: '1', name: 'Soft Paneer', price_per_kg: 240, category: 'Paneer' },
  { id: '2', name: 'Malai Paneer', price_per_kg: 250, category: 'Paneer' },
  { id: '3', name: 'Hard Paneer', price_per_kg: 250, category: 'Paneer' }
];

const AdminProducts = () => {
  const [products] = useState(mockProducts);

  return (
    <div className="animate-fade-in pb-16">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2>Product Management</h2>
          <p className="text-muted">Add, edit, or delete inventory products.</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold">{product.name}</h3>
                <span className="badge badge-accepted mt-1">{product.category}</span>
              </div>
              <p className="font-bold text-primary">₹{product.price_per_kg}/kg</p>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Available Weights:</span> 1 KG, 5 KG
            </div>
            
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
              <button className="p-2 text-gray-500 hover:text-primary transition-colors">
                <Edit2 size={18} />
              </button>
              <button className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminProducts;
