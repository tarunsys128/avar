import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useCart } from '../../context/CartContext';
import { Minus, Plus } from 'lucide-react-native';

const mockProducts = [
  { id: '1', name: 'Soft Paneer', price_per_kg: 240, category: 'Paneer' },
  { id: '2', name: 'Malai Paneer', price_per_kg: 250, category: 'Paneer' },
  { id: '3', name: 'Hard Paneer', price_per_kg: 250, category: 'Paneer' }
];

const ProductCard = ({ product }) => {
  const [weight, setWeight] = useState(1);
  const [blocks, setBlocks] = useState(1);
  const { addToCart } = useCart();

  const total = product.price_per_kg * weight * blocks;

  const handleAdd = () => {
    addToCart(product, weight, blocks);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>₹{product.price_per_kg}/kg</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{product.category}</Text>
        </View>
      </View>

      <Text style={styles.label}>Select Weight</Text>
      <View style={styles.row}>
        <TouchableOpacity 
          style={[styles.weightBtn, weight === 1 && styles.weightBtnActive]}
          onPress={() => setWeight(1)}
        >
          <Text style={[styles.weightBtnText, weight === 1 && styles.weightBtnTextActive]}>1 KG</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.weightBtn, weight === 5 && styles.weightBtnActive]}
          onPress={() => setWeight(5)}
        >
          <Text style={[styles.weightBtnText, weight === 5 && styles.weightBtnTextActive]}>5 KG</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.blocksRow}>
        <Text style={styles.label}>Blocks</Text>
        <View style={styles.counter}>
          <TouchableOpacity 
            style={styles.iconBtn}
            onPress={() => setBlocks(b => Math.max(1, b - 1))}
          >
            <Minus color="#4B5563" size={16} />
          </TouchableOpacity>
          <Text style={styles.counterText}>{blocks}</Text>
          <TouchableOpacity 
            style={[styles.iconBtn, { backgroundColor: '#4F46E5' }]}
            onPress={() => setBlocks(b => b + 1)}
          >
            <Plus color="#FFF" size={16} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalPrice}>₹{total}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.headerTitle}>Fresh Products</Text>
      {mockProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  productPrice: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  weightBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  weightBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  weightBtnText: {
    color: '#374151',
    fontWeight: '500',
  },
  weightBtnTextActive: {
    color: '#fff',
  },
  blocksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  addBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default HomeScreen;
