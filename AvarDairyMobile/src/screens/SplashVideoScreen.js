import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, StatusBar, Dimensions, ActivityIndicator, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('screen');

// Prevent the native splash screen from auto-hiding — we control it here
SplashScreen.preventAutoHideAsync().catch(() => {});

const SplashVideoScreen = ({ onFinish, isAuthLoading }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [gifFinished, setGifFinished] = useState(false);
  const finishCalled = useRef(false);
  const splashHidden = useRef(false);

  // Hide native splash ASAP
  const hideSplash = useCallback(async () => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    try { await SplashScreen.hideAsync(); } catch (e) {}
  }, []);

  // Called once to fade out and transition
  const doFinish = useCallback(() => {
    if (finishCalled.current) return;
    finishCalled.current = true;
    hideSplash();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      onFinish?.();
    });
  }, [onFinish, fadeAnim, hideSplash]);

  // When GIF finishes its time AND auth is done → transition
  useEffect(() => {
    if (gifFinished && !isAuthLoading) {
      doFinish();
    }
  }, [gifFinished, isAuthLoading, doFinish]);

  // SAFETY: After 6 seconds, force finish no matter what
  useEffect(() => {
    const t = setTimeout(() => {
      hideSplash();
      setGifFinished(true);
      // Extra safety: force if auth is still loading
      setTimeout(() => doFinish(), 1000);
    }, 6000);
    return () => clearTimeout(t);
  }, [doFinish, hideSplash]);

  return (
    <Animated.View style={[s.container, { opacity: fadeAnim }]}>
      <StatusBar hidden />
      <Image
        source={require('../../assets/intro.gif')}
        style={s.gif}
        resizeMode="cover"
        onLoad={() => {
          // GIF frame visible → hide native splash immediately
          hideSplash();
          // Allow GIF to play for a fixed amount of time (e.g. 3.5 seconds) 
          // before considering it "finished"
          setTimeout(() => {
            setGifFinished(true);
          }, 3500);
        }}
        onError={() => {
          // If GIF fails to load → skip intro
          hideSplash();
          setGifFinished(true);
        }}
      />
      
      {/* Loading spinner if waiting for network after GIF finishes */}
      {gifFinished && isAuthLoading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      )}
    </Animated.View>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gif: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});

export default SplashVideoScreen;
