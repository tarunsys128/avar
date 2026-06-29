import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import { supabase } from '../../supabase';

const ManageStaffScreen = ({ navigation }) => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  const [inputPhone, setInputPhone] = useState('');
  const [inputName, setInputName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStaffData = async () => {
    try {
      // 1. Fetch Staff profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'staff');

      if (error) throw error;

      // 2. Fetch Active Orders to calculate active deliveries for each staff
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('staff_id, status')
        .in('status', ['Pending', 'Accepted', 'Preparing', 'Ready']); // active statuses

      if (ordersError) throw ordersError;

      // Group active orders by staff
      const activeOrdersCount = {};
      orders?.forEach(o => {
        if (o.staff_id) {
          activeOrdersCount[o.staff_id] = (activeOrdersCount[o.staff_id] || 0) + 1;
        }
      });

      const formattedStaff = (profiles || []).map(p => ({
        id: p.id,
        name: p.name || 'Unnamed',
        phone: p.phone || 'N/A',
        status: p.is_available ? 'Active' : 'Offline',
        activeOrders: activeOrdersCount[p.id] || 0
      }));

      setStaffList(formattedStaff);
    } catch (err) {
      console.error("Error fetching staff:", err.message);
      Alert.alert('Error', 'Failed to fetch staff data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();

    // Subscribe to changes
    const profileChannel = supabase
      .channel('manage-staff-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: "role=eq.staff" }, fetchStaffData)
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, []);

  const handleRemove = (id, name) => {
    Alert.alert(
      "Remove Staff",
      `Are you sure you want to demote ${name} to customer? They will no longer be able to access the staff app.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            const { error } = await supabase.from('profiles').update({ role: 'customer' }).eq('id', id);
            if (error) Alert.alert("Error", error.message);
            fetchStaffData();
          }
        }
      ]
    );
  };

  const handleEdit = (staff) => {
    setModalMode('edit');
    setSelectedStaff(staff);
    setInputName(staff.name);
    setInputPhone(staff.phone);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setModalMode('add');
    setSelectedStaff(null);
    setInputName('');
    setInputPhone('');
    setModalVisible(true);
  };

  const submitModal = async () => {
    if (!inputPhone) {
      Alert.alert("Required", "Please enter a phone number.");
      return;
    }
    
    setActionLoading(true);
    try {
      if (modalMode === 'add') {
        // Find user by phone to promote them to staff
        const { data: users, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', inputPhone);
          
        if (error) throw error;

        if (!users || users.length === 0) {
          Alert.alert("Not Found", "No customer found with this phone number. They must create an account first.");
        } else {
          const user = users[0];
          if (user.role === 'staff' || user.role === 'admin') {
             Alert.alert("Info", `This user is already a ${user.role}.`);
          } else {
             const { error: updateErr } = await supabase.from('profiles').update({ role: 'staff' }).eq('id', user.id);
             if (updateErr) throw updateErr;
             Alert.alert("Success", "Customer promoted to Staff!");
             fetchStaffData();
             setModalVisible(false);
          }
        }
      } else {
        // Edit existing staff name/phone
        const { error } = await supabase
          .from('profiles')
          .update({ name: inputName, phone: inputPhone })
          .eq('id', selectedStaff.id);
          
        if (error) throw error;
        Alert.alert("Success", "Staff details updated.");
        fetchStaffData();
        setModalVisible(false);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Manage Staff</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading && staffList.length === 0 ? (
         <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
           <ActivityIndicator size="large" color={COLORS.primary} />
         </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {staffList.map(staff => (
            <View key={staff.id} style={s.staffCard}>
              <View style={s.staffInfoRow}>
                <View style={s.avatar}>
                  <Text style={s.avatarEmoji}>👨</Text>
                  {staff.status === 'Active' && <View style={s.onlineDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.staffName}>{staff.name}</Text>
                  <Text style={s.staffPhone}>📞 {staff.phone}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: staff.status === 'Active' ? COLORS.greenLight : '#F3F4F6' }]}>
                  <Text style={[s.statusTxt, { color: staff.status === 'Active' ? COLORS.green : COLORS.textGray }]}>{staff.status}</Text>
                </View>
              </View>
              
              <View style={s.staffBottom}>
                <Text style={s.ordersTxt}>Active Deliveries: <Text style={{fontWeight: 'bold', color: COLORS.textDark}}>{staff.activeOrders}</Text></Text>
                <View style={s.actionsRow}>
                  <TouchableOpacity style={[s.actionBtn, { borderColor: COLORS.border }]} onPress={() => handleEdit(staff)}>
                    <Text style={s.actionBtnTxt}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]} onPress={() => handleRemove(staff.id, staff.name)}>
                    <Text style={[s.actionBtnTxt, { color: COLORS.danger }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          {staffList.length === 0 && (
            <View style={{alignItems: 'center', marginTop: 40}}>
              <Text style={{color: COLORS.textGray}}>No staff members found.</Text>
            </View>
          )}
        </ScrollView>
      )}
      
      <TouchableOpacity style={s.fab} onPress={handleAdd}>
        <Text style={s.fabTxt}>＋ Add Staff</Text>
      </TouchableOpacity>

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
             <Text style={s.modalTitle}>{modalMode === 'add' ? 'Add Staff Member' : 'Edit Staff Member'}</Text>
             
             {modalMode === 'add' && (
                <Text style={s.modalDesc}>Enter an existing customer's phone number to promote them to staff.</Text>
             )}

             {modalMode === 'edit' && (
               <>
                 <Text style={s.inputLabel}>Name</Text>
                 <TextInput style={s.input} value={inputName} onChangeText={setInputName} placeholder="Staff Name" />
               </>
             )}

             <Text style={s.inputLabel}>Phone Number</Text>
             <TextInput style={s.input} value={inputPhone} onChangeText={setInputPhone} placeholder="+91 9876543210" keyboardType="phone-pad" />

             <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)} disabled={actionLoading}>
                   <Text style={s.cancelBtnTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={submitModal} disabled={actionLoading}>
                   {actionLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.saveBtnTxt}>{modalMode === 'add' ? 'Promote to Staff' : 'Save Details'}</Text>}
                </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bgLight },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:     { width: 38, alignItems: 'flex-start' },
  backArrow:   { fontSize: 22, color: COLORS.textDark },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },

  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  
  staffCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm,
  },
  staffInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.bgLight, 
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
    position: 'relative'
  },
  avatarEmoji: { fontSize: 24 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, 
    borderRadius: 7, backgroundColor: COLORS.green, borderWidth: 2, borderColor: COLORS.white
  },
  staffName: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  staffPhone:{ fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  statusTxt:   { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },
  
  staffBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md },
  ordersTxt: { fontSize: FONTS.sizes.sm, color: COLORS.textMed },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderRadius: RADIUS.sm },
  actionBtnTxt: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  
  fab: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: COLORS.yellow, borderRadius: RADIUS.full,
    paddingVertical: 14, alignItems: 'center',
    ...SHADOW.lg, shadowColor: COLORS.yellow,
  },
  fabTxt: { color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.base },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.xl },
  modalContainer: { backgroundColor: COLORS.white, padding: SPACING.xl, borderRadius: RADIUS.lg, ...SHADOW.lg },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.sm },
  modalDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginBottom: SPACING.lg },
  inputLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textDark, fontWeight: FONTS.weights.medium, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.base, marginBottom: SPACING.lg, backgroundColor: '#FAFAFA' },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', backgroundColor: COLORS.bgLight },
  cancelBtnTxt: { color: COLORS.textDark, fontWeight: FONTS.weights.bold },
  saveBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', backgroundColor: COLORS.green },
  saveBtnTxt: { color: COLORS.white, fontWeight: FONTS.weights.bold },
});

export default ManageStaffScreen;
