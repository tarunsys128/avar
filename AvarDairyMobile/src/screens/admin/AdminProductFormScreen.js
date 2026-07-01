import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { decode } from 'base64-arraybuffer';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { label: 'Paneer', icon: 'cube-outline' },
  { label: 'Cheese', icon: 'server-outline' },
  { label: 'Milk',   icon: 'water-outline' },
  { label: 'Butter', icon: 'restaurant-outline' },
  { label: 'Chaas',  icon: 'cafe-outline' },
  { label: 'Others', icon: 'apps-outline' }
];

const AdminProductFormScreen = ({ route, navigation }) => {
  const isEditing = route.params?.isEditing;
  const product = route.params?.product;

  const [name, setName] = useState(product?.name || '');
  const [subtitle, setSubtitle] = useState(product?.subtitle || '');
  const [description, setDescription] = useState(product?.description || '');
  const [stock, setStock] = useState(product?.stock?.toString() || '');
  const [category, setCategory] = useState(product?.category || 'Paneer');
  const [status, setStatus] = useState(product?.status || 'Available');
  const [isBestseller, setIsBestseller] = useState(product?.is_bestseller || false);
  const [image, setImage] = useState(product?.image_url || null);
  
  // Advanced Pricing Strategy
  const [isRetail, setIsRetail] = useState(product?.is_retail ?? true); // Default to retail
  const [retailPrice, setRetailPrice] = useState(product?.retail_price?.toString() || product?.price_per_kg?.toString() || '');
  const [unitType, setUnitType] = useState(product?.unit_type || 'KG');
  
  const [isWholesale, setIsWholesale] = useState(product?.is_wholesale ?? false);
  const [wholesalePrice, setWholesalePrice] = useState(product?.wholesale_price?.toString() || '');
  const [wholesaleQty, setWholesaleQty] = useState(product?.wholesale_qty?.toString() || '5');

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const selectedCat = CATEGORIES.find(c => c.label === category);
  const iconName = selectedCat?.icon || 'cube-outline';

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
      setImage(selectedImage);
    }
  };

  const uploadImage = async (imageAsset) => {
    try {
      setUploading(true);
      const fileName = `${Date.now()}_${name.replace(/\s/g, '_')}.png`;

      // Upload to 'product-images' bucket
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, decode(imageAsset.base64), {
          contentType: 'image/png'
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      Alert.alert('Upload Error', error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !stock) {
      Alert.alert('Missing Details', 'Please fill in Name and Stock.');
      return;
    }
    if (isRetail && !retailPrice) {
      Alert.alert('Missing Details', 'Please specify a Retail Price.'); return;
    }
    if (isWholesale && (!wholesalePrice || !wholesaleQty)) {
      Alert.alert('Missing Details', 'Please specify Wholesale Price and Quantity.'); return;
    }

    setLoading(true);

    let finalImageUrl = image?.uri || image;

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
      subtitle,
      description,
      stock: parseInt(stock),
      category,
      status,
      emoji: iconName, // We hijacked standard emoji col for ionicon names so DB doesn't need to change for icons.
      is_bestseller: isBestseller,
      image_url: finalImageUrl,
      is_retail: isRetail,
      is_wholesale: isWholesale,
      retail_price: isRetail ? parseFloat(retailPrice) : 0,
      wholesale_price: isWholesale ? parseFloat(wholesalePrice) : 0,
      wholesale_qty: isWholesale ? parseInt(wholesaleQty) : 0,
      unit_type: unitType,
      // Fallback for older screens:
      price_per_kg: isRetail ? parseFloat(retailPrice) : parseFloat(wholesalePrice) / parseInt(wholesaleQty),
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
          <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
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

          <Text style={s.label}>Short Subtitle</Text>
          <TextInput style={s.input} placeholder="e.g. Fresh & Soft" value={subtitle} onChangeText={setSubtitle} />
          
          <Text style={s.label}>Detailed Description</Text>
          <TextInput 
            style={[s.input, { height: 80, textAlignVertical: 'top' }]} 
            placeholder="Describe the product..." 
            multiline 
            value={description} 
            onChangeText={setDescription} 
          />

          <View style={s.row}>
            <View style={{ flex: 1, marginRight: SPACING.md }}>
              <Text style={s.label}>Stock (units) *</Text>
              <TextInput style={s.input} placeholder="0" keyboardType="numeric" value={stock} onChangeText={setStock} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Unit Type</Text>
              <TextInput style={s.input} placeholder="e.g. KG, Liter, Pkt" value={unitType} onChangeText={setUnitType} />
            </View>
          </View>

          <TouchableOpacity style={[s.bestsellerBtn, isBestseller && s.bestsellerActive]} onPress={() => setIsBestseller(!isBestseller)}>
            <Ionicons name={isBestseller ? "star" : "star-outline"} size={16} color={isBestseller ? COLORS.primary : COLORS.textGray} />
            <Text style={[s.bestsellerTxt, isBestseller && { color: COLORS.primary }]}>
              {isBestseller ? ' Bestseller' : ' Mark as Bestseller'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Pricing Structure */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Selling Structure</Text>

          {/* Retail Toggle */}
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleTitle}>Retail Selling</Text>
              <Text style={s.toggleSub}>Sell directly to customers in small units</Text>
            </View>
            <TouchableOpacity 
              style={[s.checkbox, isRetail && s.checked]} 
              onPress={() => setIsRetail(!isRetail)}>
              {isRetail && <Ionicons name="checkmark" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>

          {isRetail && (
            <View style={s.priceBox}>
              <Text style={s.label}>Retail Price (₹) per {unitType || 'Unit'}</Text>
              <TextInput style={s.input} placeholder="0.00" keyboardType="numeric" value={retailPrice} onChangeText={setRetailPrice} />
            </View>
          )}

          <View style={s.divider} />

          {/* Wholesale Toggle */}
          <View style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleTitle}>Wholesale Selling (Cartons)</Text>
              <Text style={s.toggleSub}>Bulk B2B pricing in cartons</Text>
            </View>
            <TouchableOpacity 
              style={[s.checkbox, isWholesale && s.checked]} 
              onPress={() => setIsWholesale(!isWholesale)}>
              {isWholesale && <Ionicons name="checkmark" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>

          {isWholesale && (
            <View style={s.priceBox}>
              <View style={s.row}>
                <View style={{ flex: 1, marginRight: SPACING.md }}>
                  <Text style={s.label}>Bulk Price (₹)</Text>
                  <TextInput style={s.input} placeholder="e.g. 2000" keyboardType="numeric" value={wholesalePrice} onChangeText={setWholesalePrice} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>Carton Size</Text>
                  <TextInput style={s.input} placeholder="e.g. 5" keyboardType="numeric" value={wholesaleQty} onChangeText={setWholesaleQty} />
                </View>
              </View>
              <Text style={s.hint}>This carton contains {wholesaleQty || '0'} {unitType || 'units'}. Total price: ₹{wholesalePrice || '0.00'}</Text>
            </View>
          )}
        </View>


        {/* Product Image */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Product Image</Text>
          <TouchableOpacity style={s.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: typeof image === 'string' ? image : image.uri }} style={s.previewImage} />
            ) : (
              <View style={s.imagePlaceholder}>
                <Ionicons name="camera-outline" size={40} color={COLORS.textGray} style={{marginBottom: 8}} />
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
                <Ionicons name={cat.icon} size={24} color={category === cat.label ? COLORS.primary : COLORS.textDark} />
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
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  card: { backgroundColor: COLORS.white, padding: SPACING.lg, borderRadius: RADIUS.lg, marginBottom: SPACING.lg, ...SHADOW.sm },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.sm, color: COLORS.textGray, marginBottom: 8, fontWeight: FONTS.weights.medium },
  hint: { fontSize: 11, color: COLORS.textLight, marginTop: -4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.base, color: COLORS.textDark, backgroundColor: '#FAFAFA', marginBottom: SPACING.md },
  row: { flexDirection: 'row' },
  bestsellerBtn: { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', justifyContent:'center', backgroundColor: '#FAFAFA' },
  bestsellerActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  bestsellerTxt: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.textGray },
  
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  toggleTitle: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  toggleSub: { fontSize: FONTS.sizes.xs, color: COLORS.textGray },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  priceBox: { backgroundColor: COLORS.bgLight, padding: SPACING.md, borderRadius: RADIUS.md, marginTop: SPACING.sm },

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
  placeholderTxt: { color: COLORS.textGray, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium },
  removeImg: { marginTop: SPACING.sm, alignSelf: 'center' },
  removeImgTxt: { color: COLORS.danger, fontWeight: FONTS.weights.medium, fontSize: FONTS.sizes.sm },
});

export default AdminProductFormScreen;
