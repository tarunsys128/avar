import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, StatusBar, Dimensions, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('screen');

// Prevent the native splash screen from auto-hiding — we control it here
SplashScreen.preventAutoHideAsync().catch(() => {});

const SplashVideoScreen = ({ onFinish, isAuthLoading }) => {
  const videoRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current; // start fully visible
  const [videoReady, setVideoReady] = useState(false);
  const [videoFinishedOnce, setVideoFinishedOnce] = useState(false);

  // Hide native splash once our screen is mounted and video is loaded
  const handleLoad = async () => {
    await SplashScreen.hideAsync().catch(() => {});
    setVideoReady(true);
  };

  // We are ready to transition IF the video has finished playing at least once AND we aren't loading auth
  useEffect(() => {
    if (videoFinishedOnce && !isAuthLoading) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onFinish?.();
      });
    }
  }, [videoFinishedOnce, isAuthLoading]);

  // Fallback: If 5 seconds have passed, consider it "finished once" and force hide native splash
  useEffect(() => {
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync().catch(() => {});
      setVideoFinishedOnce(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handlePlaybackStatusUpdate = (status) => {
    if (status.didJustFinish || (status.positionMillis >= 4900 && status.isPlaying)) {
      setVideoFinishedOnce(true);
    }
  };

  const handleError = async () => {
    await SplashScreen.hideAsync().catch(() => {});
    setVideoFinishedOnce(true);
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
        isLooping={true} // Loop continuously if auth takes a long time (network issue)
        onLoad={handleLoad}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={handleError}
      />
      {/* Subtle dark vignette at edges for polish */}
      <View style={s.vignette} pointerEvents="none" />
      
      {/* Professional subtle loading spinner ONLY if video finished but auth is STILL loading (network issue) */}
      {videoFinishedOnce && isAuthLoading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      )}
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
    backgroundColor: 'transparent',
    shadowColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SplashVideoScreen;
