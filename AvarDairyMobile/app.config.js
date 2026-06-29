module.exports = () => {
  const variant = process.env.APP_VARIANT || 'customer'; // default to customer
  
  let appName = 'Avar Dairy';
  let appSlug = 'avardairyadmin'; // Must match the slug in Expo EAS for projectId
  let bundleIdentifier = 'com.avardairy.customer';
  let primaryColor = '#10B981'; // Green for customer

  if (variant === 'admin') {
    appName = 'Avar Management';
    bundleIdentifier = 'com.avardairy.management';
    primaryColor = '#6366F1'; // Purple/Indigo for admin & staff app
  }

  return {
    expo: {
      name: appName,
      slug: appSlug,
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/images/icon.png',
      scheme: bundleIdentifier.replace(/\./g, ''),
      userInterfaceStyle: 'automatic',
      newArchEnabled: true,
      ios: {
        supportsTablet: true,
        bundleIdentifier: bundleIdentifier,
      },
      android: {
        package: bundleIdentifier,
        adaptiveIcon: {
          backgroundColor: '#FFFFFF',
          foregroundImage: './assets/images/icon.png',
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        permissions: [
          "WAKE_LOCK",
          "RECEIVE_BOOT_COMPLETED",
          "VIBRATE",
          "USE_FULL_SCREEN_INTENT",
          "SCHEDULE_EXACT_ALARM",
          "ACCESS_COARSE_LOCATION",
          "ACCESS_FINE_LOCATION",
          "CAMERA",
          "READ_EXTERNAL_STORAGE",
          "WRITE_EXTERNAL_STORAGE"
        ]
      },
      web: {
        favicon: './assets/images/favicon.png',
      },
      splash: {
        image: './assets/images/icon.png',
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
      },
      plugins: [
        [
          'expo-splash-screen',
          {
            image: './assets/images/icon.png',
            imageWidth: 200,
            resizeMode: 'contain',
            backgroundColor: '#FFFFFF',
            dark: {
              backgroundColor: '#000000',
            },
          },
        ],
        [
          "expo-notifications",
          {
            "icon": "./assets/images/icon.png",
            "color": "#10B981",
            "sounds": []
          }
        ],
        "expo-av"
      ],
      updates: {
        url: `https://u.expo.dev/94dcbafa-0205-4cef-9609-062fa8d09cdf`
      },
      runtimeVersion: {
        policy: "appVersion"
      },
      experiments: {
        typedRoutes: false,
        reactCompiler: false,
      },
      extra: {
        variant: variant,
        eas: {
          projectId: "94dcbafa-0205-4cef-9609-062fa8d09cdf"
        }
      }
    },
  };
};
