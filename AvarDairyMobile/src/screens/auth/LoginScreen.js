import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginWithEmail, signupWithEmail, mockLogin } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await loginWithEmail(email, password);
        if (error) throw error;
      } else {
        const { error } = await signupWithEmail(email, password, name, phone);
        if (error) throw error;
        Alert.alert('Success', 'Account created! You are now logged in as a Customer.');
      }
    } catch (error) {
      Alert.alert('Authentication Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Avar Dairy</Text>
        <Text style={styles.subtitle}>Powered by Supabase</Text>
        
        <View style={styles.form}>
          
          {!isLogin && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Rahul Kumar"
                value={name}
                onChangeText={setName}
              />
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="+919876543210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="user@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#4F46E5' }]} 
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 10, alignItems: 'center' }}>
            <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>

          {/* Dev Shortcuts */}
          <Text style={styles.devText}>Development Mock Login:</Text>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
            <TouchableOpacity onPress={() => mockLogin('customer')}><Text style={{color: '#10B981'}}>Customer</Text></TouchableOpacity>
            <Text>•</Text>
            <TouchableOpacity onPress={() => mockLogin('staff')}><Text style={{color: '#F59E0B'}}>Staff</Text></TouchableOpacity>
            <Text>•</Text>
            <TouchableOpacity onPress={() => mockLogin('admin')}><Text style={{color: '#EF4444'}}>Admin</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#4F46E5', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#F9FAFB', marginBottom: 12 },
  button: { padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  devText: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 20, marginBottom: 10 }
});

export default LoginScreen;
