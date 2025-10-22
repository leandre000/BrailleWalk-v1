import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert, Vibration, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import GradientBackground from '@/components/GradientBackground';
import Waveform from '@/components/Waveform';

type AuthState = 'idle' | 'authenticating' | 'success' | 'failed';
type AuthMethod = 'voice' | 'face' | 'both';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('both');
  const [speechRate, setSpeechRate] = useState<number>(0.7);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const welcomeMessage = 'Welcome to BrailleWalk. Your AI-powered vision assistant. Tap anywhere to authenticate using voice or face recognition.';
    if (Platform.OS !== 'web') {
      try {
        Speech.stop();
        Speech.speak(welcomeMessage, { rate: speechRate });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
      } catch (error) {
        console.log('Speech/Haptics not available:', error);
      }
    }

    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (Platform.OS !== 'web') {
        try {
          Speech.stop();
        } catch (error) {
          console.log('Speech stop failed:', error);
        }
      }
    };
  }, []);

  const handleAuthenticate = () => {
    if (authState === 'authenticating' || authState === 'success') return;

    setAuthState('authenticating');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    }

    const authMessage = authMethod === 'voice'
      ? 'Listening for voice recognition...'
      : authMethod === 'face'
        ? 'Analyzing face recognition...'
        : 'Authenticating with voice and face recognition...';

    if (Platform.OS !== 'web') {
      try {
        Speech.stop();
        Speech.speak(authMessage, { rate: speechRate });
      } catch (error) {
        console.log('Speech not available:', error);
      }
    }

    speechTimeoutRef.current = setTimeout(() => {
      const success = Math.random() > 0.2;

      if (success) {
        setAuthState('success');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        }

        const successMessage = authMethod === 'voice'
          ? 'Voice recognized successfully. Welcome back to BrailleWalk.'
          : authMethod === 'face'
            ? 'Face recognized successfully. Welcome back to BrailleWalk.'
            : 'Authentication successful. Voice and face recognized. Welcome back to BrailleWalk.';

        if (Platform.OS !== 'web') {
          try {
            Speech.stop();
            Speech.speak(successMessage, { rate: speechRate });
          } catch (error) {
            console.log('Speech not available:', error);
          }
        }

        setTimeout(() => {
          router.replace('/dashboard');
        }, 2500);
      } else {
        setAuthState('failed');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
          Vibration.vibrate([0, 200, 100, 200]);
        }

        const failMessage = 'Authentication failed. Please try again. Tap anywhere to retry.';
        if (Platform.OS !== 'web') {
          try {
            Speech.stop();
            Speech.speak(failMessage, { rate: speechRate });
          } catch (error) {
            console.log('Speech not available:', error);
          }
        }

        setTimeout(() => {
          setAuthState('idle');
        }, 3000);
      }
    }, 3000);
  };

  const getStatusText = () => {
    switch (authState) {
      case 'authenticating':
        return authMethod === 'voice'
          ? 'Listening for voice...'
          : authMethod === 'face'
            ? 'Analyzing face...'
            : 'Authenticating...';
      case 'success':
        return 'Authentication successful. Welcome back.';
      case 'failed':
        return 'Authentication failed. Tap anywhere to retry.';
      default:
        return 'Welcome to BrailleWalk. Tap anywhere to authenticate.';
    }
  };

  const getIconColor = () => {
    switch (authState) {
      case 'success':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      default:
        return '#FFFFFF';
    }
  };

  const getAuthIcon = () => {
    switch (authMethod) {
      case 'voice':
        return <MaterialIcons name="volume-up" size={80} color={getIconColor()} />;
      case 'face':
        return <MaterialIcons name="visibility" size={80} color={getIconColor()} />;
      default:
        return <MaterialIcons name="mic" size={80} color={getIconColor()} />;
    }
  };

  return (
    <GradientBackground>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        className="flex-1"
        onPress={handleAuthenticate}
        disabled={authState === 'authenticating' || authState === 'success'}
        activeOpacity={0.9}
        accessibilityLabel="Authenticate"
        accessibilityHint="Hold to authenticate with voice or face"
      >
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl font-bold text-white mb-2 text-center">BrailleWalk</Text>
          <Text className="text-lg text-white opacity-90 mb-15 text-center">Your AI-powered vision assistant.</Text>

          <View className="mb-10">
            <View 
              className="w-50 h-50 rounded-full bg-white/15 items-center justify-center border-3"
              style={{ borderColor: getIconColor() }}
            >
              {getAuthIcon()}
              {authState === 'success' && (
                <View className="absolute top-2.5 right-2.5">
                  <MaterialIcons name="check-circle" size={40} color="#10B981" />
                </View>
              )}
              {authState === 'failed' && (
                <View className="absolute top-2.5 right-2.5">
                  <MaterialIcons name="cancel" size={40} color="#EF4444" />
                </View>
              )}
            </View>
          </View>

          <View className="mb-5 px-5 py-2 bg-white/10 rounded-2xl">
            <Text className="text-sm text-white opacity-90 text-center font-medium">
              {authMethod === 'voice' ? 'Voice Recognition' :
                authMethod === 'face' ? 'Face Recognition' :
                  'Voice + Face Recognition'}
            </Text>
          </View>

          <Text className="text-xl text-white text-center font-semibold mb-10 px-8">{getStatusText()}</Text>

          <View className="h-15">
            <Waveform isActive={authState === 'authenticating'} />
          </View>
        </View>
      </TouchableOpacity>
    </GradientBackground>
  );
}
