import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('screen');

// Prevent the native splash screen from auto-hiding — we control it here
SplashScreen.preventAutoHideAsync().catch(() => {});

const SplashVideoScreen = ({ onFinish }) => {
  const videoRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current; // start fully visible
  const [ready, setReady] = useState(false);

  // Hide native splash once our screen is mounted and video is loaded
  const handleLoad = async () => {
    await SplashScreen.hideAsync().catch(() => {});
    setReady(true);
  };

  // Fade out and call onFinish
  const finishIntro = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      onFinish?.();
    });
  };

  // Hard cap: always stop and exit after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      finishIntro();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handlePlaybackStatusUpdate = (status) => {
    // Also cut off at 5s via position check (belt & suspenders)
    if (status.didJustFinish || (status.positionMillis >= 5000 && status.isPlaying)) {
      finishIntro();
    }
  };

  const handleError = () => {
    // If video fails, skip immediately
    finishIntro();
  };

  return (
    <Animated.View style={[s.container, { opacity: fadeAnim }]}>
      <StatusBar hidden />
      <Video
        ref={videoRef}
        source={require('../../assets/intro.mp4')}
        style={s.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isMuted={false}
        isLooping={false}
        onLoad={handleLoad}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={handleError}
      />
      {/* Subtle dark vignette at edges for polish */}
      <View style={s.vignette} pointerEvents="none" />
    </Animated.View>
  );
};

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999,
  },
  video: {
    width,
    height,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    // Subtle dark edge overlay using border radius trick isn't ideal in RN,
    // so we use a semi-transparent overlay on edges only
    backgroundColor: 'transparent',
    shadowColor: '#000',
  },
});

export default SplashVideoScreen;
