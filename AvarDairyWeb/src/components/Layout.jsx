import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import {
  LayoutDashboard, ShoppingCart, Package, Users, FileText, LogOut, Bell
} from 'lucide-react'
import logoImg from '../assets/logo.png'

export default function Layout({ session }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const userEmail = session?.user?.email || ''
  const userInitial = userEmail.charAt(0).toUpperCase()

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand" style={{ gap: 12 }}>
          <img 
            src={logoImg} 
            alt="Avar Dairy Logo" 
            style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'contain' }} 
          />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Avar Dairy</span>
            <span className="sidebar-brand-sub">Admin Panel</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Main Menu</span>

          <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>

          <NavLink to="/orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShoppingCart size={20} />
            Orders
          </NavLink>

          <NavLink to="/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Package size={20} />
            Products
          </NavLink>

          <NavLink to="/customers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            Customers
          </NavLink>

          <NavLink to="/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            Reports
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{userInitial}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userEmail}</div>
              <div className="sidebar-user-role">Administrator</div>
            </div>
          </div>
          <button
            className="sidebar-link"
            style={{ marginTop: 8, color: 'var(--danger)' }}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="main-area">
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
