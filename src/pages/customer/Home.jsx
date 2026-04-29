import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockProducts = [
  { id: '1', name: 'Soft Paneer', price_per_kg: 240, category: 'Paneer' },
  { id: '2', name: 'Malai Paneer', price_per_kg: 250, category: 'Paneer' },
  { id: '3', name: 'Hard Paneer', price_per_kg: 250, category: 'Paneer' }
];

const ProductCard = ({ product }) => {
  const [weight, setWeight] = useState(1);
  const [blocks, setBlocks] = useState(1);
  const { addToCart } = useCart();

  const total = product.price_per_kg * weight * blocks;

  const handleAdd = () => {
    addToCart(product, weight, blocks);
    // Could add a toast notification here
  };

  return (
    <div className="card flex flex-col gap-4 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-primary">{product.name}</h3>
          <p className="text-muted text-sm">₹{product.price_per_kg}/kg</p>
        </div>
        <div className="badge badge-accepted">{product.category}</div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Select Weight</label>
        <div className="flex gap-2">
          <button 
            className={`flex-1 py-1 rounded-md border ${weight === 1 ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={() => setWeight(1)}
          >
            1 KG
          </button>
          <button 
            className={`flex-1 py-1 rounded-md border ${weight === 5 ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={() => setWeight(5)}
          >
            5 KG
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2">
        <label className="text-sm font-medium">Blocks</label>
        <div className="flex items-center gap-3">
          <button 
            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
            onClick={() => setBlocks(b => Math.max(1, b - 1))}
          >
            <Minus size={16} />
          </button>
          <span className="font-semibold w-4 text-center">{blocks}</span>
          <button 
            className="p-1 rounded-full bg-primary text-white hover:bg-primary-hover"
            onClick={() => setBlocks(b => b + 1)}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-2">
        <div>
          <p className="text-xs text-muted">Total Price</p>
          <p className="font-bold text-lg">₹{total}</p>
        </div>
        <button className="btn-primary py-2 px-4" onClick={handleAdd}>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

const CustomerHome = () => {
  const { cart } = useCart();
  const navigate = useNavigate();
  const cartItemsCount = cart.reduce((sum, item) => sum + item.blocks, 0);

  return (
    <div className="animate-fade-in relative pb-16 md:pb-0">
      <div className="flex justify-between items-center mb-6">
        <h2>Fresh Products</h2>
        <button 
          onClick={() => navigate('/cart')}
          className="relative p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all"
        >
          <ShoppingCart size={24} className="text-primary" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default CustomerHome;
