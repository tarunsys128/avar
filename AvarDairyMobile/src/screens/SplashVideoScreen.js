import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, StatusBar, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('screen');

const SplashVideoScreen = ({ onFinish, isAuthLoading }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [gifFinished, setGifFinished] = useState(false);
  const finishCalled = useRef(false);
  const splashHidden = useRef(false);

  const hideSplash = useCallback(async () => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    try { await SplashScreen.hideAsync(); } catch (e) {}
  }, []);

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

  useEffect(() => {
    if (gifFinished && !isAuthLoading) {
      doFinish();
    }
  }, [gifFinished, isAuthLoading, doFinish]);

  useEffect(() => {
    const t = setTimeout(() => {
      hideSplash();
      setGifFinished(true);
      setTimeout(() => doFinish(), 500);
    }, 8000);
    return () => clearTimeout(t);
  }, [doFinish, hideSplash]);

  return (
    <Animated.View style={[s.container, { opacity: fadeAnim }]}>
      <StatusBar hidden />
      <Image
        source={require('../../assets/intro.gif')}
        placeholder={require('../../assets/images/intro_first_frame.png')}
        contentFit="cover"
        transition={200}
        style={s.gif}
        onLoad={() => {
          hideSplash();
          setTimeout(() => {
            setGifFinished(true);
          }, 3500);
        }}
        onError={() => {
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
