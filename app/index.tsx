import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Vibration, Platform } from 'react-native';
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
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
        style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        onPress={handleAuthenticate}
        disabled={authState === 'authenticating' || authState === 'success'}
        activeOpacity={0.9}
        accessibilityLabel="Authenticate"
        accessibilityHint="Hold to authenticate with voice or face"
      >
        <View style={styles.content}>
          <Text style={styles.title}>BrailleWalk</Text>
          <Text style={styles.subtitle}>Your AI-powered vision assistant.</Text>

          <View style={styles.iconContainer}>
            <View style={[styles.micBackground, { borderColor: getIconColor() }]}>
              {getAuthIcon()}
              {authState === 'success' && (
                <View style={styles.statusIcon}>
                  <MaterialIcons name="check-circle" size={40} color="#10B981" />
                </View>
              )}
              {authState === 'failed' && (
                <View style={styles.statusIcon}>
                  <MaterialIcons name="cancel" size={40} color="#EF4444" />
                </View>
              )}
            </View>
          </View>

          <View style={styles.authMethodContainer}>
            <Text style={styles.authMethodText}>
              {authMethod === 'voice' ? 'Voice Recognition' : 
               authMethod === 'face' ? 'Face Recognition' : 
               'Voice + Face Recognition'}
            </Text>
          </View>

          <Text style={styles.status}>{getStatusText()}</Text>

          <View style={styles.waveformContainer}>
            <Waveform isActive={authState === 'authenticating'} />
          </View>
        </View>
      </TouchableOpacity>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 60,
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  micBackground: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  statusIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  status: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600' as const,
    marginBottom: 40,
    paddingHorizontal: 32,
  },
  waveformContainer: {
    height: 60,
  },
  authMethodContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  authMethodText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
});