import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { BarChart3, Download, Calendar, TrendingUp } from 'lucide-react'

export default function Reports() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('Today') // Today, Yesterday, This Week, This Month, All Time, Custom
  const [customDates, setCustomDates] = useState({ 
    start: new Date().toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  })

  useEffect(() => { 
    fetchOrders() 
  }, [range, customDates.start, customDates.end])

  const fetchOrders = async () => {
    setLoading(true)

    let startDate = new Date()
    let endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    if (range === 'Today') {
      startDate.setHours(0, 0, 0, 0)
    } else if (range === 'Yesterday') {
      startDate.setDate(startDate.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setHours(23, 59, 59, 999)
    } else if (range === 'This Week') {
      startDate.setDate(startDate.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
    } else if (range === 'This Month') {
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
    } else if (range === 'Custom') {
      startDate = new Date(customDates.start)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(customDates.end)
      endDate.setHours(23, 59, 59, 999)
    } else if (range === 'All Time') {
      startDate = new Date('2020-01-01')
    }

    // 1. Fetch Orders with Customer and Staff profiles
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, profiles!customer_id (name, phone, business_name), staff:profiles!staff_id (name)')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
    
    // 2. Fetch Order Items mapping
    if (ordersData && ordersData.length > 0) {
      const orderIds = ordersData.map(o => o.id)
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*, products(name)')
        .in('order_id', orderIds)
        
      ordersData.forEach(o => {
        o.order_items = itemsData?.filter(i => i.order_id === o.id) || []
      })
      setOrders(ordersData)
    } else {
      setOrders([])
    }
    
    setLoading(false)
  }

  // Analytics derivation
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const deliveredOrders = orders.filter(o => o.status === 'Delivered')
  const completedRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const pendingOrders = orders.filter(o => o.status === 'Pending')

  const exportCSV = () => {
    if (orders.length === 0) {
      alert("No data available to export for this date range.");
      return;
    }

    let csvContent = "ORDER ID,DATE,TIME,CUSTOMER NAME,BUSINESS NAME,CONTACT NUMBER,DELIVERY STAFF,STATUS,TOTAL AMOUNT(INR),ITEMS ORDERED\n";
    
    orders.forEach(o => {
      const ts = new Date(o.created_at)
      const date = ts.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      const time = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      const custName = `"${(o.profiles?.name || 'Unknown').replace(/"/g, '""')}"`
      const phoneStr = o.profiles?.phone || ''
      const phone = phoneStr ? `="${phoneStr}"` : '""'
      const business = `"${(o.profiles?.business_name || '').replace(/"/g, '""')}"`
      const staffName = `"${(o.staff?.name || 'Unassigned').replace(/"/g, '""')}"`
      
      let itemsStr = 'No Items Found'
      
      if (o.order_items && o.order_items.length > 0) {
        itemsStr = o.order_items.map(i => {
          const prodName = i.products?.name || 'Unknown Item'
          const qty = i.blocks || 1
          const weight = i.weight_kg ? parseFloat(i.weight_kg) : 0
          const weightStr = weight ? ` (${weight}kg)` : ''
          return `${prodName} x ${qty}${weightStr}`
        }).join('; ')
      }
      
      const itemsFormatted = `"${itemsStr.replace(/"/g, '""')}"`

      csvContent += `${o.id.slice(-6).toUpperCase()},${date},${time},${custName},${business},${phone},${staffName},${o.status},${o.total_amount || 0},${itemsFormatted}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Avar_Dairy_Report_${range.replace(/\s+/g, '_')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>Business Reports</h1>
          <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 4 }}>
            Analyze your sales and export custom data for accounting.
          </p>
        </div>
        <button className="btn btn-primary" onClick={exportCSV}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Date Range Filters */}
      <div className="card" style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {['Today', 'Yesterday', 'This Week', 'This Month', 'All Time', 'Custom'].map(f => (
            <button 
              key={f} 
              className={`btn ${range === f ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: 13, borderRadius: 'var(--radius-full)' }}
              onClick={() => setRange(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {range === 'Custom' && (
          <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'center', background: 'var(--bg-hover)', padding: 16, borderRadius: 'var(--radius-md)' }}>
            <div style={{ flex: 1, maxWidth: 200 }}>
              <label className="input-label" style={{ fontSize: 12 }}>From Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={customDates.start}
                onChange={e => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div style={{ flex: 1, maxWidth: 200 }}>
              <label className="input-label" style={{ fontSize: 12 }}>To Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={customDates.end}
                onChange={e => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}/></div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><TrendingUp size={24} /></div>
              <div className="stat-info">
                <div className="stat-label">Total Booking Revenue</div>
                <div className="stat-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><BarChart3 size={24} /></div>
              <div className="stat-info">
                <div className="stat-label">Collected / Delivered</div>
                <div className="stat-value">₹{completedRevenue.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow"><Calendar size={24} /></div>
              <div className="stat-info">
                <div className="stat-label">Orders for this period</div>
                <div className="stat-value">{orders.length}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Viewing: {range}</span>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>{orders.length} total records</span>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
              <table className="data-table">
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                          {new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.profiles?.name || 'Unknown'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{o.profiles?.business_name || o.profiles?.phone}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{o.total_amount}</td>
                      <td>
                        <span className={`status-badge ${o.status?.toLowerCase()}`}>
                          <span className="status-dot" />
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No orders received during this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
