import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useCart } from '../../context/CartContext';
import { Minus, Plus, Trash2, MapPin, CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const CartScreen = () => {
  const { cart, updateBlocks, removeFromCart, getCartTotal, clearCart } = useCart();
  const [step, setStep] = useState(1); // 1: Cart, 2: Address, 3: Confirm
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([
    { id: '1', text: '123 Dairy Lane, Milk City', isDefault: true },
    { id: '2', text: '456 Farm Road, Cow Town', isDefault: false }
  ]);
  const [newAddress, setNewAddress] = useState('');
  const navigation = useNavigation();

  const handleAddAddress = () => {
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
    clearCart();
    setStep(3);
  };

  if (cart.length === 0 && step === 1) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.btnPrimaryText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      
      {/* Progress Steps (simplified for React Native) */}
      <View style={styles.progressRow}>
        <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>1. Cart</Text>
        <Text style={styles.stepText}>→</Text>
        <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>2. Address</Text>
        <Text style={styles.stepText}>→</Text>
        <Text style={[styles.stepText, step >= 3 && styles.stepTextActive]}>3. Done</Text>
      </View>

      {step === 1 && (
        <View>
          {cart.map((item) => (
            <View key={`${item.id}-${item.weight}`} style={styles.card}>
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSub}>{item.weight} KG Block • ₹{item.price_per_kg}/kg</Text>
                  <Text style={styles.itemPrice}>₹{item.total}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 12 }}>
                  <TouchableOpacity onPress={() => removeFromCart(item.id, item.weight)}>
                    <Trash2 color="#EF4444" size={20} />
                  </TouchableOpacity>
                  <View style={styles.counter}>
                    <TouchableOpacity 
                      style={styles.iconBtn}
                      onPress={() => updateBlocks(item.id, item.weight, item.blocks - 1)}
                    >
                      <Minus color="#4B5563" size={16} />
                    </TouchableOpacity>
                    <Text style={styles.counterText}>{item.blocks}</Text>
                    <TouchableOpacity 
                      style={styles.iconBtn}
                      onPress={() => updateBlocks(item.id, item.weight, item.blocks + 1)}
                    >
                      <Plus color="#4B5563" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
          
          <View style={[styles.card, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1 }]}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalPriceLarge}>₹{getCartTotal()}</Text>
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setStep(2)}>
              <Text style={styles.btnPrimaryText}>Proceed to Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 2 && (
        <View>
          <TouchableOpacity onPress={() => setStep(1)} style={{ marginBottom: 16 }}>
            <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>← Back to Cart</Text>
          </TouchableOpacity>
          
          <Text style={styles.sectionTitle}>Select Delivery Address</Text>
          
          {addresses.map((addr) => (
            <TouchableOpacity 
              key={addr.id} 
              style={[styles.card, selectedAddress === addr.id && styles.cardActive]}
              onPress={() => setSelectedAddress(addr.id)}
            >
              <View style={styles.itemRow}>
                <MapPin color={selectedAddress === addr.id ? '#4F46E5' : '#9CA3AF'} size={20} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.addressText}>{addr.text}</Text>
                  {addr.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <View style={[styles.card, { borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB' }]}>
            <Text style={styles.label}>Add New Address</Text>
            <View style={styles.row}>
              <TextInput 
                style={styles.input}
                placeholder="Enter full address..."
                value={newAddress}
                onChangeText={setNewAddress}
              />
              <TouchableOpacity style={styles.btnAdd} onPress={handleAddAddress}>
                <Text style={styles.btnAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.card, { marginTop: 16 }]}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Payment Mode</Text>
              <Text style={styles.totalPriceLarge}>COD</Text>
            </View>
            <TouchableOpacity 
              style={[styles.btnPrimary, !selectedAddress && { backgroundColor: '#9CA3AF' }]} 
              onPress={handlePlaceOrder}
              disabled={!selectedAddress}
            >
              <Text style={styles.btnPrimaryText}>Place Order (₹{getCartTotal()})</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.emptyContainer}>
          <CheckCircle color="#10B981" size={64} style={{ marginBottom: 16 }} />
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSub}>Your fresh paneer will be delivered soon.</Text>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => { setStep(1); navigation.navigate('Home'); }}>
            <Text style={styles.btnSecondaryText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 400 },
  emptyText: { fontSize: 18, color: '#6B7280', marginBottom: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  stepText: { color: '#9CA3AF', fontWeight: '600' },
  stepTextActive: { color: '#4F46E5', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardActive: { borderColor: '#4F46E5', borderWidth: 2, backgroundColor: '#EEF2FF' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  itemSub: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#4F46E5', marginTop: 8 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', padding: 4, borderRadius: 8 },
  iconBtn: { backgroundColor: '#fff', padding: 4, borderRadius: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
  counterText: { fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 14, color: '#6B7280' },
  totalPriceLarge: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  btnPrimary: { backgroundColor: '#4F46E5', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', padding: 14, borderRadius: 8, alignItems: 'center', width: '100%' },
  btnSecondaryText: { color: '#374151', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  addressText: { fontSize: 14, fontWeight: '500' },
  defaultBadge: { backgroundColor: '#E5E7EB', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 10, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  btnAdd: { backgroundColor: '#10B981', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 8 },
  btnAddText: { color: '#fff', fontWeight: 'bold' },
  successTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#6B7280', marginBottom: 24 }
});

export default CartScreen;
