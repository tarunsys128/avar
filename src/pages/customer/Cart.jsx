import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { Minus, Plus, Trash2, MapPin, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cart, updateBlocks, removeFromCart, getCartTotal, clearCart } = useCart();
  const [step, setStep] = useState(1); // 1: Cart, 2: Address, 3: Confirm
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([
    { id: '1', text: '123 Dairy Lane, Milk City', isDefault: true },
    { id: '2', text: '456 Farm Road, Cow Town', isDefault: false }
  ]);
  const [newAddress, setNewAddress] = useState('');
  const navigate = useNavigate();

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddress.trim()) return;
    const newAddr = {
      id: Date.now().toString(),
      text: newAddress,
      isDefault: addresses.length === 0
    };
    setAddresses([...addresses, newAddr]);
    setSelectedAddress(newAddr.id);
    setNewAddress('');
  };

  const handlePlaceOrder = () => {
    // Here we would typically save the order to Firestore
    // db.collection('Orders').add(...)
    console.log("Order placed:", { cart, total: getCartTotal(), addressId: selectedAddress, status: 'Pending' });
    clearCart();
    setStep(3); // Success step
  };

  if (cart.length === 0 && step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="p-6 bg-white rounded-full shadow-sm mb-4">
          <ShoppingCart size={48} className="text-gray-300" />
        </div>
        <h2 className="text-xl text-gray-600 mb-4">Your cart is empty</h2>
        <button className="btn-primary" onClick={() => navigate('/')}>Browse Products</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto pb-16">
      {/* Progress Steps */}
      <div className="flex justify-between items-center mb-8 px-4">
        <div className={`flex flex-col items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>1</div>
          <span className="text-xs">Cart</span>
        </div>
        <div className={`flex-1 h-1 mx-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
        <div className={`flex flex-col items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>2</div>
          <span className="text-xs">Address</span>
        </div>
        <div className={`flex-1 h-1 mx-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
        <div className={`flex flex-col items-center ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>3</div>
          <span className="text-xs">Done</span>
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="mb-2">Order Breakdown</h2>
          {cart.map((item) => (
            <div key={`${item.id}-${item.weight}`} className="card flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{item.name}</h4>
                <p className="text-sm text-muted">{item.weight} KG Block • ₹{item.price_per_kg}/kg</p>
                <p className="font-bold text-primary mt-1">₹{item.total}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <button 
                  onClick={() => removeFromCart(item.id, item.weight)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={18} />
                </button>
                <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg border border-gray-100">
                  <button 
                    className="p-1 rounded-md bg-white shadow-sm hover:bg-gray-50"
                    onClick={() => updateBlocks(item.id, item.weight, item.blocks - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-semibold w-4 text-center">{item.blocks}</span>
                  <button 
                    className="p-1 rounded-md bg-white shadow-sm hover:bg-gray-50"
                    onClick={() => updateBlocks(item.id, item.weight, item.blocks + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="card mt-4 bg-primary/5 border-primary/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted">Total Amount</span>
              <span className="font-bold text-2xl text-primary">₹{getCartTotal()}</span>
            </div>
            <button className="btn-primary w-full mt-4" onClick={() => setStep(2)}>
              Proceed to Address
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setStep(1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-800">
              ← Back
            </button>
            <h2>Select Delivery Address</h2>
          </div>
          
          {addresses.map((addr) => (
            <div 
              key={addr.id} 
              className={`card cursor-pointer border-2 transition-all flex items-start gap-3 ${selectedAddress === addr.id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-200'}`}
              onClick={() => setSelectedAddress(addr.id)}
            >
              <div className={`mt-1 rounded-full p-1 ${selectedAddress === addr.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                <MapPin size={16} />
              </div>
              <div>
                <p className="font-medium">{addr.text}</p>
                {addr.isDefault && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full mt-1 inline-block">Default</span>}
              </div>
            </div>
          ))}

          <form onSubmit={handleAddAddress} className="card bg-gray-50 mt-2 border border-dashed border-gray-300">
            <h4 className="text-sm font-semibold mb-3">Add New Address</h4>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="input-field bg-white" 
                placeholder="Enter full address..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
              />
              <button type="submit" className="btn-secondary whitespace-nowrap">Add</button>
            </div>
          </form>

          <div className="card mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted">Payment Mode</span>
              <span className="font-bold">Cash on Delivery (COD)</span>
            </div>
            <button 
              className="btn-primary w-full" 
              onClick={handlePlaceOrder}
              disabled={!selectedAddress}
            >
              Place Order (₹{getCartTotal()})
            </button>
            {!selectedAddress && <p className="text-xs text-red-500 text-center mt-2">Please select an address first</p>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="p-4 bg-green-100 text-green-600 rounded-full mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
          <p className="text-muted mb-8">Your fresh paneer will be delivered soon.</p>
          <button className="btn-secondary" onClick={() => { setStep(1); navigate('/'); }}>
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
