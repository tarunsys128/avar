import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Search, Users as UsersIcon, Phone, Mail } from 'lucide-react'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setCustomers(data)
    setLoading(false)
  }

  const filtered = customers.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.business_name?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return <div className="loader-center"><div className="spinner" /></div>
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>Customers</h1>
          <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 4 }}>
            {customers.length} registered customers
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 340, marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input-field"
          style={{ paddingLeft: 36, width: '100%' }}
          placeholder="Search by name, phone, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Customer Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map(customer => (
          <div key={customer.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 18, flexShrink: 0,
              }}>
                {(customer.name || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {customer.name || 'Unnamed'}
                </div>
                {customer.business_name && (
                  <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{customer.business_name}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                  Joined {formatDate(customer.created_at)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {customer.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-med)' }}>
                  <Phone size={14} style={{ color: 'var(--text-light)' }} />
                  {customer.phone}
                </div>
              )}
              {customer.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-med)' }}>
                  <Mail size={14} style={{ color: 'var(--text-light)' }} />
                  {customer.email}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>
              <span className={`status-badge ${customer.role === 'admin' ? 'accepted' : customer.role === 'staff' ? 'pending' : 'delivered'}`} style={{ fontSize: 11 }}>
                <span className="status-dot" />
                {customer.role || 'Customer'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <UsersIcon size={48} />
          <p>No customers found</p>
        </div>
      )}
    </div>
  )
}
