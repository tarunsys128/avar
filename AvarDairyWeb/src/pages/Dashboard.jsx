import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import {
  ShoppingCart, Package, Users, TrendingUp, IndianRupee, Clock, CheckCircle2
} from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, customers: 0, pending: 0, delivered: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDashboard() }, [])

  const fetchDashboard = async () => {
    setLoading(true)

    // Fetch orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*, profiles:customer_id (name, phone), order_items(*, products(name))')
      .order('created_at', { ascending: false })

    // Fetch product count
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true })

    // Fetch customer count
    const { count: customerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })

    if (orders) {
      const revenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
      const pending = orders.filter(o => o.status === 'Pending').length
      const delivered = orders.filter(o => o.status === 'Delivered').length

      setStats({
        orders: orders.length,
        revenue,
        products: productCount || 0,
        customers: customerCount || 0,
        pending,
        delivered,
      })
      setRecentOrders(orders.slice(0, 8))
    }

    setLoading(false)
  }

  const formatDate = (d) => {
    if (!d) return '-'
    const date = new Date(d)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <div className="loader-center"><div className="spinner" /></div>
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 4 }}>
          Welcome back! Here's what's happening with Avar Dairy today.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon green"><ShoppingCart size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{stats.orders}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><IndianRupee size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">₹{stats.revenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><Clock size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{stats.pending}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle2 size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Delivered</div>
            <div className="stat-value">{stats.delivered}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Package size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Products</div>
            <div className="stat-value">{stats.products}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Customers</div>
            <div className="stat-value">{stats.customers}</div>
          </div>
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Orders</span>
          <Link to="/orders" className="btn btn-outline btn-sm">View All</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.profiles?.name || 'Customer'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{order.profiles?.phone || ''}</div>
                  </td>
                  <td>
                    <div className="order-items-list">
                      {order.order_items?.length > 0 ? order.order_items.map((item, idx) => {
                        const boxSize = (item.weight_kg && item.blocks) ? (item.weight_kg / item.blocks) : item.weight_kg || '?'
                        const name = item.products?.name || 'Product'
                        return (
                          <span key={idx} className="order-item-pill">
                            <span className="item-dot" />
                            {name} ({boxSize}kg) <span className="item-qty">× {item.blocks || 1}</span>
                          </span>
                        )
                      }) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{order.total_amount?.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`status-badge ${order.status?.toLowerCase()}`}>
                      <span className="status-dot" />
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div>{formatDate(order.created_at)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{formatTime(order.created_at)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
