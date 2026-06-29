import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, ActivityIndicator, Alert, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import { notifyStaffAndAdmin, sendLocalNotification } from '../../services/notificationService';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const { width } = Dimensions.get('window');

const AddressSelectionScreen = ({ navigation }) => {
  const { cart, clearCart, getCartTotal } = useCart();
  const { currentUser } = useAuth();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const DELIVERY_CHARGE = 40;
  const PACKAGING_CHARGE = 10;
  const FREE_DELIVERY_AT = 500;

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    if (!currentUser?.id) return;
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      if (data && data.length > 0) {
        setSelectedId(data[0].id);
      } else {
        setIsAddingNew(true);
      }
    } catch (err) {
      console.log("Error fetching addresses:", err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!currentUser?.id) {
      Alert.alert('Error', 'You must be logged in to place an order.');
      return;
    }

    if (isAddingNew && newAddress.trim().length < 10) {
      Alert.alert('Error', 'Please provide a complete delivery address.');
      return;
    }

    setLoading(true);

    try {
      // 1. Determine final address string
      let deliveryAddress = '';
      if (isAddingNew) {
        deliveryAddress = newAddress.trim();
        // Optional: Save new address to DB for future use
        await supabase.from('addresses').insert({ 
          user_id: currentUser.id, 
          address: deliveryAddress 
        });
      } else {
        const addr = addresses.find(a => a.id === selectedId);
        deliveryAddress = addr ? addr.address : '';
      }

      if (!deliveryAddress) throw new Error("Delivery address is required.");

      // Calculate total (wholesale: no free delivery threshold)
      const subtotal = getCartTotal();
      const finalTotal = subtotal;

      // 2. Create the order in Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: currentUser.id,
          total_amount: Number(finalTotal.toFixed(2)),
          status: 'Pending',
          delivery_address: deliveryAddress,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error("Failed to initialize order.");

      // 3. Create the order items (carton-based wholesale)
      const CARTON_KG = 5;
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        blocks:      parseInt(item.qty) || 0,            // number of cartons
        weight_kg:   (item.qty * CARTON_KG),              // total kg
        price_per_kg: Number(item.price_per_kg) || 0,     // rate per kg
        total_price:  Number((item.price_per_kg * CARTON_KG * item.qty).toFixed(2)),
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Notify staff/admin about the new order
      await notifyStaffAndAdmin({
        orderId: orderData.id,
        customerName: currentUser?.name || currentUser?.email || 'A customer',
        totalAmount: finalTotal.toFixed(2),
      });

      // 5. Send local confirmation notification to customer
      await sendLocalNotification({
        title: '🎉 Order Placed Successfully!',
        body: `Your order of ₹${finalTotal.toFixed(2)} has been placed. We will confirm it shortly.`,
        data: { orderId: orderData.id },
      });

      // 6. Clean up and navigate
      clearCart();
      navigation.navigate('OrderTracking', { orderId: orderData.id });

    } catch (error) {
      console.error("Order Failure:", error);
      Alert.alert('Order Failed', error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getCartTotal();
  const delivery = subtotal >= FREE_DELIVERY_AT ? 0 : DELIVERY_CHARGE;
  const packaging = cart.length > 0 ? PACKAGING_CHARGE : 0;
  const finalTotal = subtotal + delivery + packaging;

  if (fetching) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} disabled={loading}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Delivery Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionTitle}>Select Delivery Address</Text>

        {addresses.map((addr) => (
          <TouchableOpacity
            key={addr.id}
            style={[s.addressCard, selectedId === addr.id && !isAddingNew && s.addressCardActive]}
            onPress={() => { setSelectedId(addr.id); setIsAddingNew(false); }}
            disabled={loading}
          >
            <View style={s.radioCircle}>
              {(selectedId === addr.id && !isAddingNew) && <View style={s.radioDot} />}
            </View>
            <View style={s.addressInfo}>
              <View style={s.labelRow}>
                <Text style={s.addressLabel}>{addr.is_default ? 'Default Address' : 'Saved Address'}</Text>
              </View>
              <Text style={s.addressText}>{addr.address}</Text>
              {addr.phone ? <Text style={[s.addressText, { color: COLORS.primary, marginTop: 4, fontWeight: '600' }]}>📞 {addr.phone}</Text> : null}
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity 
          style={[s.addNewBtn, isAddingNew && s.addressCardActive]} 
          onPress={() => setIsAddingNew(true)} 
          disabled={loading}
        >
          <View style={s.radioCircle}>
            {isAddingNew && <View style={s.radioDot} />}
          </View>
          <Text style={s.addNewTxt}>Add a New Address</Text>
        </TouchableOpacity>

        {isAddingNew && (
          <View style={s.inputContainer}>
            <TextInput 
              style={s.input}
              placeholder="Enter complete address (House No, Street, City, ZIP)"
              placeholderTextColor={COLORS.textGray}
              multiline
              numberOfLines={4}
              value={newAddress}
              onChangeText={setNewAddress}
              editable={!loading}
            />
          </View>
        )}

        <View style={s.billSection}>
          <Text style={s.sectionTitle}>Order Summary</Text>
          <View style={s.billRow}>
            <Text style={s.billLabel}>Subtotal</Text>
            <Text style={s.billValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={s.billRow}>
            <Text style={s.billLabel}>Delivery Fee</Text>
            <Text style={[s.billValue, delivery === 0 && { color: COLORS.green }]}>
              {delivery === 0 ? 'FREE' : `₹${delivery}`}
            </Text>
          </View>
          <View style={s.billRow}>
            <Text style={s.billLabel}>Packaging</Text>
            <Text style={s.billValue}>₹{packaging}</Text>
          </View>
          <View style={[s.billRow, s.totalRow]}>
            <Text style={s.totalLabel}>Total Payable</Text>
            <Text style={s.totalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={s.footerBar}>
        <TouchableOpacity 
          style={[s.placeBtn, (isAddingNew && newAddress.trim().length < 10) && { opacity: 0.5 }]} 
          onPress={handleConfirmOrder}
          disabled={loading || (isAddingNew && newAddress.trim().length < 10)}
        >
          {loading ? (
             <ActivityIndicator color={COLORS.white} />
          ) : (
             <Text style={s.placeBtnTxt}>Confirm & Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: SPACING.lg, paddingBottom: 120 },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, ...SHADOW.sm
  },
  backBtn:     { width: 38, alignItems: 'flex-start' },
  backArrow:   { fontSize: 24, color: COLORS.textDark },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },

  sectionTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textDark, marginBottom: SPACING.md, marginTop: SPACING.sm },

  addressCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center'
  },
  addressCardActive: {
    borderColor: COLORS.green, backgroundColor: COLORS.greenLight + '10',
  },
  
  radioCircle: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  radioDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.green,
  },

  addressInfo: { flex: 1 },
  labelRow:    { marginBottom: 4 },
  addressLabel:{ fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.textDark },
  addressText: { fontSize: FONTS.sizes.sm, color: COLORS.textMed, lineHeight: 20 },

  addNewBtn: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.lg,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md
  },
  addNewTxt:  { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textDark },

  inputContainer: { marginBottom: SPACING.xl },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg,
    padding: SPACING.md, fontSize: FONTS.sizes.sm, color: COLORS.textDark,
    backgroundColor: COLORS.white, textAlignVertical: 'top', minHeight: 100
  },

  billSection: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.lg, marginTop: SPACING.md, ...SHADOW.sm },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  billLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMed },
  billValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textDark },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalLabel: { fontSize: FONTS.sizes.base, fontWeight: 'bold', color: COLORS.textDark },
  totalValue: { fontSize: FONTS.sizes.lg, fontWeight: '900', color: COLORS.green },

  footerBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, padding: SPACING.lg,
    borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOW.lg,
  },
  placeBtn: {
    backgroundColor: COLORS.green, borderRadius: RADIUS.xl,
    paddingVertical: 16, alignItems: 'center', ...SHADOW.md, shadowColor: COLORS.green,
  },
  placeBtnTxt: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: 'bold' },
});

export default AddressSelectionScreen;
