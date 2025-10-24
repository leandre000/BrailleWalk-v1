import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Vibration, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

import GradientBackground from '@/components/GradientBackground';
import Waveform from '@/components/Waveform';
import VoiceCommandListener from '@/components/VoiceCommandListener';
import { matchCommand, getSuggestions, GLOBAL_COMMANDS } from '@/utils/commandMatcher';
import { speechManager } from '@/utils/speechManager';

type AuthState = 'idle' | 'authenticating' | 'success' | 'failed';
type AuthMethod = 'voice' | 'face' | 'both';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('both');
  const [speechRate] = useState<number>(1);
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const welcomeMessage = 'Welcome to BrailleWalk. Your AI-powered vision assistant. Tap anywhere to authenticate using voice or face recognition.';
    if (Platform.OS !== 'web') {
      try {
        speechManager.speak(welcomeMessage, { rate: speechRate });
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    const authMessage = authMethod === 'voice'
      ? 'Listening for voice recognition...'
      : authMethod === 'face'
        ? 'Analyzing face recognition...'
        : 'Authenticating with voice and face recognition...';

    if (Platform.OS !== 'web') {
      try {
        speechManager.speak(authMessage, { rate: speechRate, language: 'en-US' });
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
            speechManager.speak(successMessage, { 
              rate: speechRate, 
              language: 'en-US',
              onDone: () => {
                // Route immediately after speech finishes
                router.replace('/dashboard');
              },
              onError: () => {
                // If speech fails, route after 2 seconds
                setTimeout(() => {
                  router.replace('/dashboard');
                }, 2000);
              }
            });
          } catch (error) {
            console.log('Speech not available:', error);
            // If speech module not available, route after 2 seconds
            setTimeout(() => {
              router.replace('/dashboard');
            }, 2000);
          }
        } else {
          // Web platform - no speech, route after 2 seconds
          setTimeout(() => {
            router.replace('/dashboard');
          }, 2000);
        }
      } else {
        setAuthState('failed');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
          Vibration.vibrate([0, 200, 100, 200]);
        }

        const failMessage = 'Authentication failed. Please try again. Tap anywhere to retry.';
        if (Platform.OS !== 'web') {
          try {
            speechManager.speak(failMessage, { rate: speechRate, language: 'en-US' });
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
        return <MaterialIcons name="volume-up" size={120} color={getIconColor()} />;
      case 'face':
        return <MaterialIcons name="visibility" size={120} color={getIconColor()} />;
      default:
        return <MaterialIcons name="mic" size={120} color={getIconColor()} />;
    }
  };

  const handleVoiceCommand = (command: string, confidence?: number) => {
    // Define authentication-specific commands
    const authCommands = [
      { command: 'login', aliases: ['login', 'sign in', 'authenticate', 'start', 'begin', 'enter', 'go'], description: 'Start authentication' }
    ];
    
    // Use fuzzy matching
    const match = matchCommand(command, authCommands, 0.6);
    
    if (match) {
      console.log(`Matched: ${match.command} (confidence: ${match.confidence})`);
      handleAuthenticate();
    } else {
      // Command not recognized - provide suggestions
      const suggestions = getSuggestions(command, authCommands, 3);
      
      let errorMessage = "I didn't understand that. ";
      if (suggestions.length > 0) {
        errorMessage += `Try saying: ${suggestions.slice(0, 2).join(', or ')}.`;
      } else {
        errorMessage += "Say 'login' or 'sign in' to authenticate.";
      }
      
      if (Platform.OS !== 'web') {
        speechManager.speak(errorMessage, { rate: 1, language: 'en-US' });
      }
      
      console.log(`Command not recognized: "${command}". Suggestions: ${suggestions.join(', ')}`);
    }
  };

  return (
    <GradientBackground>
      <TouchableOpacity
        style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
        className="flex-1"
        onPress={handleAuthenticate}
        disabled={authState === 'authenticating' || authState === 'success'}
        activeOpacity={0.9}
        accessibilityLabel="Authenticate"
        accessibilityHint="Hold to authenticate with voice or face"
      >
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl font-bold text-white mb-3 text-center">BrailleWalk</Text>
          <Text className="text-base text-white opacity-80 mb-20 text-center">Your AI-powered vision assistant.</Text>

          <View className="mb-16">
            <View 
              className="w-64 h-64 rounded-full bg-white/10 items-center justify-center border-4"
              style={{ borderColor: getIconColor() }}
            >
              {getAuthIcon()}
              {authState === 'success' && (
                <View className="absolute top-4 right-4">
                  <MaterialIcons name="check-circle" size={48} color="#10B981" />
                </View>
              )}
              {authState === 'failed' && (
                <View className="absolute top-4 right-4">
                  <MaterialIcons name="cancel" size={48} color="#EF4444" />
                </View>
              )}
            </View>
          </View>

          <Text className="text-lg text-white text-center font-medium mb-12 px-8 opacity-90">{getStatusText()}</Text>

          <View className="h-16 mb-8">
            <Waveform isActive={authState === 'authenticating'} />
          </View>
        </View>

        {/* Voice Command Listener */}
        <VoiceCommandListener
          onCommand={handleVoiceCommand}
          enabled={authState === 'idle' || authState === 'failed'}
          continuousMode={true}
          showVisualFeedback={true}
        />
      </TouchableOpacity>
    </GradientBackground>
  );
}
