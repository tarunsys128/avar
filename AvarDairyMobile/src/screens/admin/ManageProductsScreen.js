import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../constants/theme';

const ManageProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) setProducts(data);
    setLoading(false);
    setRefreshing(false);
  };

  // Reload whenever screen comes into focus (e.g., after adding/editing a product)
  useFocusEffect(useCallback(() => { fetchProducts(); }, []));

  const handleAddProduct = () => navigation.navigate('AdminProductForm', { isEditing: false });
  const handleEditProduct = (product) => navigation.navigate('AdminProductForm', { isEditing: true, product });

  const handleDeleteProduct = (product) => {
    Alert.alert('Delete Product', `Delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('products').delete().eq('id', product.id);
          if (error) Alert.alert('Error', error.message);
          else fetchProducts();
        }
      }
    ]);
  };

  const cycleStatus = async (product) => {
    const next = product.status === 'Available' ? 'OutOfStock' : product.status === 'OutOfStock' ? 'ComingSoon' : 'Available';
    const { error } = await supabase.from('products').update({ status: next }).eq('id', product.id);
    if (!error) setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: next } : p));
  };

  const getStatusColor = (status) => {
    if (status === 'Available') return COLORS.green;
    if (status === 'OutOfStock') return COLORS.danger;
    if (status === 'ComingSoon') return COLORS.orange;
    return COLORS.textGray;
  };

  const getStatusLabel = (status) => {
    if (status === 'OutOfStock') return 'Out of Stock';
    if (status === 'ComingSoon') return 'Coming Soon';
    return 'In Stock';
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Manage Catalog ({products.length})</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} />}
      >
        <Text style={s.hint}>Tap status badge to change availability. Hold a card to delete.</Text>
        {products.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🧀</Text>
            <Text style={s.emptyTxt}>No products yet. Add your first product!</Text>
          </View>
        )}
        {products.map(product => (
          <TouchableOpacity
            key={product.id}
            style={s.productCard}
            onPress={() => handleEditProduct(product)}
            onLongPress={() => handleDeleteProduct(product)}
            activeOpacity={0.7}
          >
            <View style={s.productIconBox}><Text style={{ fontSize: 32 }}>{product.emoji || '🧀'}</Text></View>
            <View style={s.productInfo}>
              <Text style={s.productName}>{product.name}</Text>
              <Text style={s.productCategory}>{product.category}</Text>
              <Text style={s.productPrice}>₹{product.price_per_kg}/kg</Text>
            </View>
            <View style={s.stockBox}>
              <Text style={s.stockLabel}>Stock</Text>
              <Text style={[s.stockValue, (product.stock || 0) < 20 && { color: COLORS.danger }]}>
                {product.stock ?? '—'}
              </Text>
              <TouchableOpacity
                style={[s.statusBtn, { backgroundColor: getStatusColor(product.status) + '20' }]}
                onPress={() => cycleStatus(product)}
              >
                <Text style={[s.statusTxt, { color: getStatusColor(product.status) }]}>
                  {getStatusLabel(product.status)}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={handleAddProduct}>
        <Text style={s.fabTxt}>＋ Add Product</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 38, alignItems: 'flex-start' },
  backArrow: { fontSize: 22, color: COLORS.textDark },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark },

  hint: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginBottom: SPACING.md },
  scroll: { padding: SPACING.lg, paddingBottom: 100 },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { color: COLORS.textGray, fontSize: FONTS.sizes.base, textAlign: 'center' },

  productCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md, alignItems: 'center', ...SHADOW.sm,
  },
  productIconBox: {
    width: 60, height: 60, borderRadius: RADIUS.md, backgroundColor: COLORS.bgLight,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md
  },
  productInfo: { flex: 1 },
  productName: { fontSize: FONTS.sizes.base, fontWeight: FONTS.weights.bold, color: COLORS.textDark },
  productCategory: { fontSize: FONTS.sizes.xs, color: COLORS.textGray, marginTop: 2 },
  productPrice: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, color: COLORS.green, marginTop: 4 },

  stockBox: { alignItems: 'flex-end', justifyContent: 'center' },
  stockLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textGray },
  stockValue: { fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold, color: COLORS.textDark, marginTop: 2, marginBottom: 8 },
  statusBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  statusTxt: { fontSize: 10, fontWeight: FONTS.weights.bold },

  fab: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: 14, alignItems: 'center',
    ...SHADOW.lg, shadowColor: COLORS.primary,
  },
  fabTxt: { color: COLORS.white, fontWeight: FONTS.weights.bold, fontSize: FONTS.sizes.base },
});

export default ManageProductsScreen;
