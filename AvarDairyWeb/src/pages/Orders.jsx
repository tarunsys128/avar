import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Search, Filter, ChevronDown, CheckCircle2, Clock, Truck, XCircle, Eye } from 'lucide-react'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles:customer_id (name, phone, email, business_name), order_items(*, products(name))')
      .order('created_at', { ascending: false })

    if (!error && data) setOrders(data)
    setLoading(false)
  }

  const updateStatus = async (orderId, newStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }
  }

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'All' || o.status === filter
    const matchesSearch = !search ||
      o.profiles?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.profiles?.phone?.includes(search) ||
      o.id?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const filters = ['All', 'Pending', 'Accepted', 'Delivered', 'Cancelled']

  const formatDate = (d) => {
    if (!d) return '-'
    const date = new Date(d)
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const statusActions = (order) => {
    const s = order.status
    const actions = []
    if (s === 'Pending') {
      actions.push({ label: 'Accept', status: 'Accepted', cls: 'btn-primary' })
      actions.push({ label: 'Cancel', status: 'Cancelled', cls: 'btn-danger' })
    }
    if (s === 'Accepted') {
      actions.push({ label: 'Mark Delivered', status: 'Delivered', cls: 'btn-primary' })
    }
    return actions
  }

  if (loading) {
    return <div className="loader-center"><div className="spinner" /></div>
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>Orders</h1>
          <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 4 }}>
            {orders.length} total orders · {orders.filter(o => o.status === 'Pending').length} pending
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchOrders}>
          ↻ Refresh
        </button>
      </div>

      {/* ── Filters + Search ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Search by name, phone, or order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {filters.map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(f)}
            >
              {f} {f !== 'All' && `(${orders.filter(o => o.status === f).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Items Ordered</th>
                <th>Address</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <ShoppingCartOff />
                      <p>No orders found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.profiles?.name || 'Customer'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{order.profiles?.phone || ''}</div>
                      {order.profiles?.business_name && (
                        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{order.profiles.business_name}</div>
                      )}
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
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No items data</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: 180, fontSize: 13, lineHeight: 1.4 }}>
                        {order.delivery_address || '-'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>₹{order.total_amount?.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`status-badge ${order.status?.toLowerCase()}`}>
                        <span className="status-dot" />
                        {order.status}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                      {formatDate(order.created_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {statusActions(order).map((action, i) => (
                          <button
                            key={i}
                            className={`btn btn-sm ${action.cls}`}
                            onClick={() => updateStatus(order.id, action.status)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ShoppingCartOff() {
  return <XCircle size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
}
