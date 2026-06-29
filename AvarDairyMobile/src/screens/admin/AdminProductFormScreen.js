import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { decode } from 'base64-arraybuffer';

const CATEGORIES = [
  { label: 'Paneer', icon: '🧀' },
  { label: 'Cheese', icon: '🧀' },
  { label: 'Milk',   icon: '🥛' },
  { label: 'Butter', icon: '🧈' },
  { label: 'Chaas',  icon: '🥤' },
  { label: 'Others', icon: '📦' }
];

const AdminProductFormScreen = ({ route, navigation }) => {
  const isEditing = route.params?.isEditing;
  const product = route.params?.product;

  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price_per_kg?.toString() || '');
  const [stock, setStock] = useState(product?.stock?.toString() || '');
  const [category, setCategory] = useState(product?.category || 'Paneer');
  const [status, setStatus] = useState(product?.status || 'Available');
  const [subtitle, setSubtitle] = useState(product?.subtitle || '');
  const [isBestseller, setIsBestseller] = useState(product?.is_bestseller || false);
  const [image, setImage] = useState(product?.image_url || null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const selectedCat = CATEGORIES.find(c => c.label === category);
  const icon = selectedCat?.icon || '🧀';

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0];
      setImage(selectedImage.uri);
      
      // Upload immediately or on save? Let's do it on save to be safe, 
      // but store the base64 or uri.
      setImage(selectedImage);
    }
  };

  const uploadImage = async (imageAsset) => {
    try {
      setUploading(true);
      const fileName = `${Date.now()}_${name.replace(/\s/g, '_')}.png`;
      const filePath = `product-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, decode(imageAsset.base64), {
          contentType: 'image/png'
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      Alert.alert('Upload Error', error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !price || !stock) {
      Alert.alert('Missing Details', 'Please fill in Name, Price, and Stock.');
      return;
    }
    setLoading(true);

    let finalImageUrl = image?.uri || image; // if it's already a string (url) or new asset

    if (image && typeof image === 'object') {
      const uploadedUrl = await uploadImage(image);
      if (!uploadedUrl) {
        setLoading(false);
        return;
      }
      finalImageUrl = uploadedUrl;
    }

    const payload = {
      name,
      price_per_kg: parseFloat(price),
      stock: parseInt(stock),
      category,
      status,
      emoji: icon,
      subtitle,
      is_bestseller: isBestseller,
      image_url: finalImageUrl,
    };

    let error;
    if (isEditing) {
      ({ error } = await supabase.from('products').update(payload).eq('id', product.id));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }

    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', `Product ${isEditing ? 'updated' : 'added'} successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? 'Edit Product' : 'Add New Product'}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Basic Info */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Basic Information</Text>

          <Text style={s.label}>Product Name *</Text>
          <TextInput style={s.input} placeholder="e.g. Malai Paneer 500g" value={name} onChangeText={setName} />

          <Text style={s.label}>Short Description</Text>
          <TextInput style={s.input} placeholder="e.g. Fresh & Soft" value={subtitle} onChangeText={setSubtitle} />

          <View style={s.row}>
            <View style={{ flex: 1, marginRight: SPACING.md }}>
              <Text style={s.label}>Price (₹/kg) *</Text>
              <TextInput style={s.input} placeholder="0.00" keyboardType="numeric" value={price} onChangeText={setPrice} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Stock (units) *</Text>
              <TextInput style={s.input} placeholder="0" keyboardType="numeric" value={stock} onChangeText={setStock} />
            </View>
          </View>

          <TouchableOpacity style={[s.bestsellerBtn, isBestseller && s.bestsellerActive]} onPress={() => setIsBestseller(!isBestseller)}>
            <Text style={[s.bestsellerTxt, isBestseller && { color: COLORS.primary }]}>
              {isBestseller ? '⭐ Bestseller' : '☆ Mark as Bestseller'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Image */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Product Image</Text>
          <TouchableOpacity style={s.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: typeof image === 'string' ? image : image.uri }} style={s.previewImage} />
            ) : (
              <View style={s.imagePlaceholder}>
                <Text style={s.placeholderEmoji}>📸</Text>
                <Text style={s.placeholderTxt}>Upload Product Image</Text>
              </View>
            )}
          </TouchableOpacity>
          {image && (
            <TouchableOpacity style={s.removeImg} onPress={() => setImage(null)}>
              <Text style={s.removeImgTxt}>Remove Image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Category</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.label}
                style={[s.catBtn, category === cat.label && s.catBtnActive]}
                onPress={() => setCategory(cat.label)}
              >
                <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
                <Text style={[s.catTxt, category === cat.label && s.catTxtActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Status */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Availability Status</Text>
          <View style={s.statusRow}>
            {[
              { key: 'Available', label: 'In Stock', color: COLORS.green },
              { key: 'OutOfStock', label: 'Out of Stock', color: COLORS.danger },
              { key: 'ComingSoon', label: 'Coming Soon', color: COLORS.orange },
            ].map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[s.statusOpt, status === opt.key && { borderColor: opt.color, backgroundColor: opt.color + '10' }]}
                onPress={() => setStatus(opt.key)}
              >
                <Text style={[s.statusOptTxt, status === opt.key && { color: opt.color }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={loading || uploading}>
          {loading || uploading ? <ActivityIndicator color={COLORS.white} /> :
            <Text style={s.saveBtnTxt}>{isEditing ? 'Save Changes' : 'Create Product'}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.bgLight, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 20, color: COLORS.textDark, marginTop: -2 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  card: { backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: RADIUS.lg, marginBottom: SPACING.lg, ...SHADOW.sm },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginBottom: 8, fontWeight: FONTS.weights.medium },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.base, color: COLORS.textDark, backgroundColor: '#FAFAFA', marginBottom: SPACING.md },
  row: { flexDirection: 'row' },
  bestsellerBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', backgroundColor: '#FAFAFA' },
  bestsellerActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  bestsellerTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textGray },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catBtn: { width: '30%', aspectRatio: 1, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  catBtnActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  catTxt: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 4, fontWeight: FONTS.weights.medium },
  catTxtActive: { color: COLORS.primary, fontWeight: FONTS.weights.bold },
  statusRow: { flexDirection: 'row', gap: SPACING.sm },
  statusOpt: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', backgroundColor: '#FAFAFA' },
  statusOptTxt: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold, color: COLORS.textGray },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOW.md },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  saveBtnTxt: { color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.lg },
  imagePicker: { width: '100%', height: 200, backgroundColor: '#FAFAFA', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { alignItems: 'center' },
  placeholderEmoji: { fontSize: 40, marginBottom: 8 },
  placeholderTxt: { color: COLORS.textGray, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium },
  removeImg: { marginTop: SPACING.sm, alignSelf: 'center' },
  removeImgTxt: { color: COLORS.danger, fontWeight: FONTS.weights.medium, fontSize: FONTS.sizes.sm },
});

export default AdminProductFormScreen;
