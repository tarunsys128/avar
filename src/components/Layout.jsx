import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Package, Settings, Users, ClipboardList } from 'lucide-react';

const Layout = () => {
  const { userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
    return (
      <button 
        onClick={() => navigate(to)}
        className={`flex items-center gap-2 w-full p-3 rounded-md transition-colors ${
          isActive ? 'bg-primary text-white' : 'hover:bg-gray-200 text-gray-700'
        }`}
        style={{
          backgroundColor: isActive ? 'var(--primary)' : 'transparent',
          color: isActive ? 'white' : 'var(--text-main)'
        }}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar */}
      <aside className="w-64 glass-panel m-4 flex flex-col hidden md:flex sticky top-4 h-[calc(100vh-2rem)] p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary">Avar Dairy</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {userRole === 'customer' && (
            <>
              <NavItem to="/" icon={Home} label="Home" />
              <NavItem to="/cart" icon={Package} label="Cart" />
              <NavItem to="/profile" icon={Settings} label="Profile" />
            </>
          )}

          {userRole === 'staff' && (
            <>
              <NavItem to="/staff" icon={ClipboardList} label="Orders" />
            </>
          )}

          {userRole === 'admin' && (
            <>
              <NavItem to="/admin" icon={Home} label="Dashboard" />
              <NavItem to="/admin/orders" icon={ClipboardList} label="All Orders" />
              <NavItem to="/admin/products" icon={Package} label="Products" />
              <NavItem to="/admin/staff" icon={Users} label="Staff" />
            </>
          )}
        </nav>

        <div className="mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full p-3 rounded-md hover:bg-red-50 text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
      
      {/* Mobile Bottom Nav (Very basic for now, can be expanded) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t-0 rounded-b-none p-2 flex justify-around">
        {userRole === 'customer' && (
          <>
            <button onClick={() => navigate('/')} className="p-2"><Home size={24} /></button>
            <button onClick={() => navigate('/cart')} className="p-2"><Package size={24} /></button>
            <button onClick={() => navigate('/profile')} className="p-2"><Settings size={24} /></button>
          </>
        )}
        {/* We can add staff/admin mobile nav if needed */}
      </div>
    </div>
  );
};

export default Layout;
