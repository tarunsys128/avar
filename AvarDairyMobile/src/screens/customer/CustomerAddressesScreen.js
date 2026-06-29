import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const CustomerAddressesScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    fetchAddresses();
  }, [currentUser]);

  const fetchAddresses = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setAddresses(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setNewLabel('Home');
    setNewAddress('');
    setNewCity('');
    setNewPhone('');
  };

  const handleEdit = (addr) => {
    setEditingId(addr.id);
    setNewLabel(addr.label || 'Home');
    setNewAddress(addr.address || '');
    setNewCity(addr.city || '');
    setNewPhone(addr.phone || '');
    setIsAddingNew(true);
  };

  const handleSaveAddress = async () => {
    if (!newAddress || !newCity) {
      Alert.alert('Error', 'Please fill in the complete address and city');
      return;
    }

    setLoading(true);
    const payload = {
      user_id: currentUser.id,
      label: newLabel,
      address: newAddress,
      city: newCity,
      phone: newPhone,
      is_default: editingId ? undefined : (addresses.length === 0),
    };

    let result;
    if (editingId) {
      result = await supabase
        .from('addresses')
        .update(payload)
        .eq('id', editingId);
    } else {
      result = await supabase
        .from('addresses')
        .insert(payload);
    }

    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else {
      resetForm();
      fetchAddresses();
    }
    setLoading(false);
  };

  const handleSetDefault = async (id) => {
    setLoading(true);
    // 1. Remove default from others
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', currentUser.id);
    // 2. Set this one as default
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    fetchAddresses();
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setLoading(true);
        await supabase.from('addresses').delete().eq('id', id);
        fetchAddresses();
      }}
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Addresses</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {loading && addresses.length === 0 ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {addresses.map(addr => (
              <View key={addr.id} style={s.addressCard}>
                <View style={s.labelRow}>
                  <Text style={s.addressLabel}>{addr.label}</Text>
                  {addr.is_default && <View style={s.defaultBadge}><Text style={s.defaultTxt}>Default</Text></View>}
                </View>
                <Text style={s.addressText}>{addr.address}</Text>
                <Text style={s.cityText}>{addr.city}</Text>
                {addr.phone ? <Text style={s.phoneText}>📞 {addr.phone}</Text> : null}
                
                <View style={s.actionsRow}>
                  {!addr.is_default && (
                    <>
                      <TouchableOpacity style={s.actionBtn} onPress={() => handleSetDefault(addr.id)}>
                        <Text style={[s.actionTxt, { color: COLORS.orange }]}>Set Default</Text>
                      </TouchableOpacity>
                      <View style={s.actionDivider} />
                    </>
                  )}
                  <TouchableOpacity style={s.actionBtn} onPress={() => handleEdit(addr)}>
                    <Text style={s.actionTxt}>Edit</Text>
                  </TouchableOpacity>
                  <View style={s.actionDivider} />
                  <TouchableOpacity style={s.actionBtn} onPress={() => handleDelete(addr.id)}>
                    <Text style={s.actionTxtDanger}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {!isAddingNew ? (
              <TouchableOpacity style={s.addNewBtn} onPress={() => setIsAddingNew(true)}>
                <Text style={s.addNewIcon}>＋</Text>
                <Text style={s.addNewTxt}>Add New Address</Text>
              </TouchableOpacity>
            ) : (
              <View style={[s.addressCard, { borderColor: COLORS.primary, borderWidth: 1 }]}>
                <Text style={s.addressLabel}>{editingId ? 'Edit Address' : 'Add New Address'}</Text>
                
                <View style={s.labelChips}>
                  {['Home', 'Work', 'Other'].map(lbl => (
                    <TouchableOpacity 
                      key={lbl} 
                      style={[s.chip, newLabel === lbl && s.chipActive]}
                      onPress={() => setNewLabel(lbl)}
                    >
                      <Text style={[s.chipTxt, newLabel === lbl && s.chipTxtActive]}>{lbl}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput 
                  style={s.input}
                  placeholder="Street Address (e.g. B-104 Sunrise Apts)"
                  placeholderTextColor={COLORS.textLight}
                  value={newAddress}
                  onChangeText={setNewAddress}
                />
                <TextInput 
                  style={s.input}
                  placeholder="City & Pincode (e.g. Noida 201301)"
                  placeholderTextColor={COLORS.textLight}
                  value={newCity}
                  onChangeText={setNewCity}
                />
                <TextInput 
                  style={s.input}
                  placeholder="Phone Number (Optional)"
                  placeholderTextColor={COLORS.textLight}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  keyboardType="phone-pad"
                />

                <View style={s.formActions}>
                  <TouchableOpacity style={[s.formBtn, s.cancelBtn]} onPress={resetForm}>
                    <Text style={s.cancelBtnTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.formBtn, s.saveBtn]} onPress={handleSaveAddress}>
                    <Text style={s.saveBtnTxt}>{editingId ? 'Update' : 'Save'} Address</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  scroll: { padding: SPACING.lg, paddingBottom: 60 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 38, alignItems: 'flex-start' },
  backArrow: { fontSize: 22, color: COLORS.textDark },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  
  addressCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  addressLabel: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  defaultBadge: { backgroundColor: COLORS.yellowLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  defaultTxt: { fontSize: 10, color: '#B45309', fontWeight: FONTS.weights.bold },
  addressText: { fontSize: FONTS.sizes.sm, color: COLORS.textMed, lineHeight: 20 },
  cityText: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginTop: 2 },
  phoneText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  actionTxt: { color: COLORS.primary, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.sm },
  actionTxtDanger: { color: COLORS.danger, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.sm },
  actionDivider: { width: 1, height: 14, backgroundColor: COLORS.border },

  addNewBtn: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed', borderRadius: RADIUS.lg,
    marginTop: SPACING.sm, justifyContent: 'center'
  },
  addNewIcon: { fontSize: 20, color: COLORS.primary, marginRight: 8, marginTop: -2 },
  addNewTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.primary },

  labelChips: { flexDirection: 'row', gap: 8, marginVertical: SPACING.md },
  chip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt: { fontSize: FONTS.sizes.xs, color: COLORS.textMed, fontWeight: FONTS.weights.medium },
  chipTxtActive: { color: COLORS.white, fontWeight: FONTS.weights.bold },

  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm,
    padding: SPACING.md, marginBottom: SPACING.sm, fontSize: FONTS.sizes.sm, color: COLORS.textDark,
    backgroundColor: COLORS.bgLight
  },
  
  formActions: { flexDirection: 'row', gap: 12, marginTop: SPACING.sm },
  formBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: COLORS.bgLight, borderWidth: 1, borderColor: COLORS.border },
  cancelBtnTxt: { color: COLORS.textDark, fontWeight: FONTS.weights.bold },
  saveBtn: { backgroundColor: COLORS.primary },
  saveBtnTxt: { color: COLORS.white, fontWeight: FONTS.weights.bold },
});

export default CustomerAddressesScreen;
