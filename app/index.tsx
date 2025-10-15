import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mic, CheckCircle, XCircle, Eye, Volume2 } from 'lucide-react-native';
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
    // Welcome message with improved accessibility
    const welcomeMessage = 'Welcome to BrailleWalk. Your AI-powered vision assistant. Tap anywhere to authenticate using voice or face recognition.';
    try { Speech.stop(); } catch {}
    Speech.speak(welcomeMessage, { rate: speechRate });
    
    // Provide haptic feedback for app launch
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      try { Speech.stop(); } catch {}
    };
  }, []);

  const handleAuthenticate = () => {
    if (authState === 'authenticating' || authState === 'success') return;
    
    setAuthState('authenticating');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const authMessage = authMethod === 'voice' 
      ? 'Listening for voice recognition...' 
      : authMethod === 'face' 
      ? 'Analyzing face recognition...'
      : 'Authenticating with voice and face recognition...';
    
    try { Speech.stop(); } catch {}
    Speech.speak(authMessage, { rate: speechRate });

    // Simulate authentication process with more realistic timing
    speechTimeoutRef.current = setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      
      if (success) {
        setAuthState('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        const successMessage = authMethod === 'voice' 
          ? 'Voice recognized successfully. Welcome back to BrailleWalk.'
          : authMethod === 'face'
          ? 'Face recognized successfully. Welcome back to BrailleWalk.'
          : 'Authentication successful. Voice and face recognized. Welcome back to BrailleWalk.';
        
        try { Speech.stop(); } catch {}
        Speech.speak(successMessage, { rate: speechRate });
        
        setTimeout(() => {
          router.replace('/dashboard');
        }, 2500);
      } else {
        setAuthState('failed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Vibration.vibrate([0, 200, 100, 200]); // Error vibration pattern
        
        const failMessage = 'Authentication failed. Please try again. Tap anywhere to retry.';
        try { Speech.stop(); } catch {}
        Speech.speak(failMessage, { rate: speechRate });
        
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
        return <Volume2 size={80} color={getIconColor()} strokeWidth={2} />;
      case 'face':
        return <Eye size={80} color={getIconColor()} strokeWidth={2} />;
      default:
        return <Mic size={80} color={getIconColor()} strokeWidth={2} />;
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
                  <CheckCircle size={40} color="#10B981" fill="#10B981" />
                </View>
              )}
              {authState === 'failed' && (
                <View style={styles.statusIcon}>
                  <XCircle size={40} color="#EF4444" fill="#EF4444" />
                </View>
              )}
            </View>
          </View>

          {/* Authentication Method Indicator */}
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
