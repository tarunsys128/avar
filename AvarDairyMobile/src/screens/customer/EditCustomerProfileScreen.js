import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

const EditCustomerProfileScreen = ({ navigation }) => {
  const { currentUser } = useAuth();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || null);
  
  // B2B Details
  const [businessType, setBusinessType] = useState(currentUser?.business_type || 'Retail');
  const [businessName, setBusinessName] = useState(currentUser?.business_name || '');
  const [businessAddress, setBusinessAddress] = useState(currentUser?.address || '');
  const [gstNumber, setGstNumber] = useState(currentUser?.gst_number || '');
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Sync state if currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setAvatarUrl(currentUser.avatar_url || null);
      setBusinessType(currentUser.business_type || 'Retail');
      setBusinessName(currentUser.business_name || '');
      setBusinessAddress(currentUser.address || '');
      setGstNumber(currentUser.gst_number || '');
    }
  }, [currentUser]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      
      const fileExt = uri.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      });

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !phone) {
      Alert.alert("Missing Details", "Name and Phone are required.");
      return;
    }
    setLoading(true);

    const payload = {
      name,
      phone,
      avatar_url: avatarUrl,
      business_type: businessType,
      business_name: businessType === 'Retail' ? null : businessName,
      address: businessType === 'Retail' ? null : businessAddress,
      gst_number: businessType === 'Retail' ? null : gstNumber,
    };

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', currentUser?.id);

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }
  };

  const isB2B = businessType !== 'Retail';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Avatar Section */}
        <View style={s.avatarSection}>
          <TouchableOpacity style={s.avatarWrapper} onPress={pickImage} disabled={uploading}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarEmoji}>👤</Text>
              </View>
            )}
            <View style={s.editIconBadge}>
              <Text style={s.editIconTxt}>✎</Text>
            </View>
            {uploading && (
              <View style={s.uploadOverlay}>
                <ActivityIndicator color={COLORS.white} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={s.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Personal Details */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Personal Information</Text>
          <Text style={s.label}>Full Name *</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} />
          <Text style={s.label}>Phone Number *</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>

        {/* Business Type Selector */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Account Type</Text>
          <View style={s.typeRow}>
            {['Retail', 'Wholesaler', 'Restaurant'].map(type => (
              <TouchableOpacity 
                key={type} 
                style={[s.typeBtn, businessType === type && s.typeBtnActive]}
                onPress={() => setBusinessType(type)}
              >
                <Text style={[s.typeTxt, businessType === type && s.typeTxtActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* B2B Details */}
        {isB2B && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Business Details</Text>
            
            <Text style={s.label}>Business Name *</Text>
            <TextInput style={s.input} placeholder="e.g. ABC Sweets" value={businessName} onChangeText={setBusinessName} />
            
            <Text style={s.label}>Business Address *</Text>
            <TextInput style={[s.input, { height: 80 }]} placeholder="Full business address" multiline value={businessAddress} onChangeText={setBusinessAddress} />
            
            <Text style={s.label}>GST Number (Optional)</Text>
            <TextInput style={s.input} placeholder="22AAAAA0000A1Z5" autoCapitalize="characters" value={gstNumber} onChangeText={setGstNumber} />
          </View>
        )}

      </ScrollView>

      {/* Save Button */}
      <View style={s.footer}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={loading || uploading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.saveBtnTxt}>Save Profile</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 20, color: COLORS.textDark, marginTop: -2 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  
  avatarSection: { alignItems: 'center', marginBottom: SPACING.xl },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.white, ...SHADOW.md, overflow: 'hidden', borderWidth: 3, borderColor: COLORS.white },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 50 },
  avatarHint: { marginTop: 8, fontSize: 12, color: COLORS.textGray, fontWeight: '500' },
  editIconBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white },
  editIconTxt: { color: COLORS.white, fontSize: 14, fontWeight: 'bold' },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },

  card: { backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: RADIUS.lg, marginBottom: SPACING.lg, ...SHADOW.sm },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.md },
  
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginBottom: 8, fontWeight: FONTS.weights.medium },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.base, color: COLORS.textDark, backgroundColor: '#FAFAFA', marginBottom: SPACING.md, textAlignVertical: 'top' },

  typeRow: { flexDirection: 'row', gap: SPACING.sm },
  typeBtn: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, alignItems: 'center', backgroundColor: '#FAFAFA' },
  typeBtnActive: { backgroundColor: COLORS.yellowLight, borderColor: COLORS.yellow },
  typeTxt: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, fontWeight: FONTS.weights.medium },
  typeTxtActive: { color: '#B45309', fontWeight: FONTS.weights.bold },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOW.md },
  saveBtn: { backgroundColor: COLORS.green, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  saveBtnTxt: { color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.lg },
});

export default EditCustomerProfileScreen;
