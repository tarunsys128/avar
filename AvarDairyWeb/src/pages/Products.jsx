import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Search, Plus, Edit3, Trash2, Package, X } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('category', { ascending: true })
    if (data) setProducts(data)
    setLoading(false)
  }

  const handleSave = async (product) => {
    const payload = {
      name: product.name || 'Unnamed Product',
      price_per_kg: parseFloat(product.price_per_kg) || 0,
      category: product.category,
      status: product.status,
      subtitle: product.subtitle || null,
      is_wholesale: product.is_wholesale || false,
      wholesale_price: product.wholesale_price ? parseFloat(product.wholesale_price) : null,
      wholesale_qty: product.wholesale_qty ? parseFloat(product.wholesale_qty) : null,
      unit_type: product.unit_type || 'kg'
    }

    if (product.id) {
      // Update existing
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', product.id)

      if (!error) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...payload } : p))
        setEditingProduct(null)
      } else {
        alert("Error updating product: " + error.message)
      }
    } else {
      // Create new
      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select()

      if (!error && data) {
        setProducts(prev => [...prev, data[0]])
        setEditingProduct(null)
      } else if (error) {
        alert("Error adding product: " + error.message)
      }
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setEditingProduct(null);
    }
  }

  const filtered = products.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  const categoryGroups = {}
  filtered.forEach(p => {
    const cat = p.category || 'Others'
    if (!categoryGroups[cat]) categoryGroups[cat] = []
    categoryGroups[cat].push(p)
  })

  if (loading) {
    return <div className="loader-center"><div className="spinner" /></div>
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>Products</h1>
          <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: 4 }}>
            {products.length} products registered
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setEditingProduct({ name: '', price_per_kg: '', category: 'Cheese', subtitle: '', status: 'Active', is_wholesale: false })}
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Product Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price / kg</th>
                <th>Wholesale</th>
                <th>Status</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-md)',
                        background: 'var(--primary-50)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Package size={18} style={{ color: 'var(--primary)' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{product.name}</div>
                        {product.subtitle && (
                          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{product.subtitle}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      background: 'var(--bg)', padding: '4px 10px', borderRadius: 'var(--radius-full)',
                      fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                    }}>
                      {product.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{product.price_per_kg || '-'}</td>
                  <td>
                    {product.is_wholesale ? (
                      <span style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>₹{product.wholesale_price}</span>
                        <span style={{ color: 'var(--text-light)' }}> / {product.wholesale_qty} {product.unit_type}</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${product.status === 'Active' ? 'delivered' : product.status === 'OutOfStock' ? 'cancelled' : 'pending'}`}>
                      <span className="status-dot" />
                      {product.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditingProduct({ ...product })}>
                      <Edit3 size={14} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-card fade-in">
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct.id ? 'Edit Product' : 'Add Product'}</h2>
              <button className="modal-close" onClick={() => setEditingProduct(null)}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Product Name</label>
                <input className="input-field" value={editingProduct.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Price per kg (₹)</label>
                  <input className="input-field" type="number" value={editingProduct.price_per_kg || ''} onChange={e => setEditingProduct({ ...editingProduct, price_per_kg: parseFloat(e.target.value) })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <input className="input-field" value={editingProduct.category || ''} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Subtitle (Optional)</label>
                <input className="input-field" value={editingProduct.subtitle || ''} onChange={e => setEditingProduct({ ...editingProduct, subtitle: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Status</label>
                <select className="input-field" value={editingProduct.status || 'Active'} onChange={e => setEditingProduct({ ...editingProduct, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="OutOfStock">Out of Stock</option>
                  <option value="ComingSoon">Coming Soon</option>
                </select>
              </div>

              {/* Wholesale Settings */}
              <div style={{ padding: '16px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: editingProduct.is_wholesale ? 16 : 0 }}>
                  <input type="checkbox" checked={editingProduct.is_wholesale || false} onChange={e => setEditingProduct({ ...editingProduct, is_wholesale: e.target.checked })} style={{ width: 16, height: 16 }} />
                  Enable Bulk Wholesale Variant
                </label>
                
                {editingProduct.is_wholesale && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Wholesale Price (₹)</label>
                      <input className="input-field" type="number" value={editingProduct.wholesale_price || ''} onChange={e => setEditingProduct({ ...editingProduct, wholesale_price: parseFloat(e.target.value) })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Bulk Box Qty</label>
                      <input className="input-field" type="number" value={editingProduct.wholesale_qty || ''} onChange={e => setEditingProduct({ ...editingProduct, wholesale_qty: parseFloat(e.target.value) })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Unit</label>
                      <select className="input-field" value={editingProduct.unit_type || 'kg'} onChange={e => setEditingProduct({ ...editingProduct, unit_type: e.target.value })}>
                        <option value="kg">kg</option>
                        <option value="box">box</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                {editingProduct.id ? (
                  <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--border)' }} onClick={() => handleDelete(editingProduct.id)}>
                    <Trash2 size={16} /> Delete
                  </button>
                ) : <div />}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-outline" onClick={() => setEditingProduct(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => handleSave(editingProduct)}>Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
