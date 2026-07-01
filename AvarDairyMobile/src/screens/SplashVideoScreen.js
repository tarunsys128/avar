import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, StatusBar, Dimensions, ActivityIndicator, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('screen');

// Prevent the native splash screen from auto-hiding — we control it here
SplashScreen.preventAutoHideAsync().catch(() => {});

const SplashVideoScreen = ({ onFinish, isAuthLoading }) => {
  const videoRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoFinished, setVideoFinished] = useState(false);
  const finishCalled = useRef(false);

  // Step 1: Hide native splash screen IMMEDIATELY on first render
  // This ensures users see our black screen instead of the stuck logo
  useEffect(() => {
    const hideNative = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Already hidden or not available
      }
      setNativeSplashHidden(true);
    };
    hideNative();
  }, []);

  // Step 2: Transition away when conditions are met
  const doFinish = useCallback(() => {
    if (finishCalled.current) return;
    finishCalled.current = true;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      onFinish?.();
    });
  }, [onFinish, fadeAnim]);

  useEffect(() => {
    if (videoFinished && !isAuthLoading) {
      doFinish();
    }
  }, [videoFinished, isAuthLoading, doFinish]);

  // Step 3: Absolute safety net — after 8 seconds, skip everything no matter what
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setVideoFinished(true);
      // If auth is STILL loading after 8s, force finish anyway
      // (better to show login than a black screen forever)
      setTimeout(() => {
        doFinish();
      }, 500);
    }, 8000);
    return () => clearTimeout(safetyTimer);
  }, [doFinish]);

  // Video callbacks
  const handleVideoLoad = () => {
    setVideoPlaying(true);
  };

  const handlePlaybackStatus = (status) => {
    if (status.didJustFinish) {
      setVideoFinished(true);
    }
  };

  const handleVideoError = () => {
    // Video failed to load (codec issue, missing file, etc.)
    // Skip intro entirely — don't get stuck
    setVideoFinished(true);
  };

  return (
    <Animated.View style={[s.container, { opacity: fadeAnim }]}>
      <StatusBar hidden />

      {/* Show app logo briefly while video is loading */}
      {!videoPlaying && (
        <View style={s.logoContainer}>
          <Image
            source={require('../../assets/images/icon.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </View>
      )}

      {/* The video player — hidden behind logo until loaded */}
      <Video
        ref={videoRef}
        source={require('../../assets/intro.mp4')}
        style={[s.video, !videoPlaying && s.hiddenVideo]}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isMuted={false}
        isLooping={false}
        onLoad={handleVideoLoad}
        onPlaybackStatusUpdate={handlePlaybackStatus}
        onError={handleVideoError}
      />

      {/* Loading spinner if auth is still in progress after video ends */}
      {videoFinished && isAuthLoading && (
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 2,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  video: {
    position: 'absolute',
    width,
    height,
    zIndex: 3,
  },
  hiddenVideo: {
    opacity: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});

export default SplashVideoScreen;
