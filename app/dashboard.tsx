import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

import GradientBackground from '@/components/GradientBackground';
import Waveform from '@/components/Waveform';
import VoiceCommandListener from '@/components/VoiceCommandListener';
import { matchCommand, getSuggestions, GLOBAL_COMMANDS } from '@/utils/commandMatcher';

interface DashboardFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isListening] = useState<boolean>(true);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features: DashboardFeature[] = [
    {
      id: 'navigate',
      title: 'Navigate',
      description: 'Get real-time walking guidance and obstacle detection',
      icon: <Ionicons name="navigate" size={50} color="#0047AB" />,
      route: '/navigate',
      color: '#10B981'
    },
    {
      id: 'scan',
      title: 'Scan Object',
      description: 'Read text, identify objects, and describe your surroundings',
      icon: <Feather name="camera" size={50} color="#0047AB" />,
      route: '/scan',
      color: '#3B82F6'
    },
    {
      id: 'emergency',
      title: 'I need help',
      description: 'Contact your caregiver and share your location',
      icon: <Ionicons name="call" size={50} color="#0047AB" />,
      route: '/emergency',
      color: '#EF4444'
    }
  ];

  useEffect(() => {
    const welcomeMessage =
      'Welcome to BrailleWalk dashboard. You have three main features available: Navigate for walking guidance, Scan Object for reading text and identifying objects, and I need help for emergency contacts. Tap any feature to get started.';
    if (Platform.OS !== 'web') {
      try {
        Speech.speak(welcomeMessage, { rate: 1 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch (error) {
        console.log('Speech/Haptics not available:', error);
      }
    }
  }, []);

  const handleFeaturePress = (feature: DashboardFeature) => {
    setSelectedFeature(feature.id);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    const featureMessage =
      feature.id === 'navigate'
        ? 'Starting navigation mode. You will receive real-time guidance for safe walking.'
        : feature.id === 'scan'
        ? 'Starting scan mode. Point your camera at objects or text to get descriptions.'
        : 'Starting emergency mode. You will be connected with your caregiver.';

    if (Platform.OS !== 'web') {
      try {
        Speech.speak(featureMessage, { 
          rate: 1, 
          language: 'en-US',
          onDone: () => {
            // Route immediately after speech finishes
            router.push(feature.route as any);
          },
          onError: () => {
            // If speech fails, route after 2 seconds
            setTimeout(() => {
              router.push(feature.route as any);
            }, 2000);
          }
        });
      } catch (error) {
        console.log('Speech not available:', error);
        // If speech module not available, route after 2 seconds
        setTimeout(() => {
          router.push(feature.route as any);
        }, 2000);
      }
    } else {
      // Web platform - no speech, route after 2 seconds
      setTimeout(() => {
        router.push(feature.route as any);
      }, 2000);
    }
  };

  const handleRepeatInstructions = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    
    const instructionsMessage = 'Tap Navigate for walking guidance, Scan Object for reading text and identifying objects, or I need help for emergency contacts.';
    
    if (Platform.OS !== 'web') {
      try {
        Speech.speak(instructionsMessage, { rate: 1, language: 'en-US' });
      } catch (error) {
        console.log('Speech not available:', error);
      }
    }
  };

  const handleVoiceCommand = (command: string, confidence?: number) => {
    // Use fuzzy matching to find the best command match
    const match = matchCommand(command, GLOBAL_COMMANDS, 0.6);
    
    if (match) {
      // Log for debugging
      console.log(`Matched: ${match.command} (confidence: ${match.confidence}, heard: "${match.matchedPhrase}")`);
      
      // Handle matched command
      if (match.command === 'navigate') {
        const navFeature = features.find(f => f.id === 'navigate');
        if (navFeature) {
          handleFeaturePress(navFeature);
        }
      }
      else if (match.command === 'scan') {
        const scanFeature = features.find(f => f.id === 'scan');
        if (scanFeature) {
          handleFeaturePress(scanFeature);
        }
      }
      else if (match.command === 'emergency') {
        const emergencyFeature = features.find(f => f.id === 'emergency');
        if (emergencyFeature) {
          handleFeaturePress(emergencyFeature);
        }
      }
      else if (match.command === 'repeat') {
        handleRepeatInstructions();
      }
      else if (match.command === 'back') {
        router.back();
      }
    } else {
      // Command not recognized - provide helpful suggestions
      const suggestions = getSuggestions(command, GLOBAL_COMMANDS, 3);
      
      let errorMessage = "I didn't understand that. ";
      if (suggestions.length > 0) {
        errorMessage += `Did you mean: ${suggestions.slice(0, 2).join(', or ')}?`;
      } else {
        errorMessage += "Try saying: navigate, scan, or emergency.";
      }
      
      if (Platform.OS !== 'web') {
        Speech.speak(errorMessage, { rate: 1, language: 'en-US' });
      }
      
      console.log(`Command not recognized: "${command}". Suggestions: ${suggestions.join(', ')}`);
    }
  };

  return (
    <GradientBackground>
      <View 
        className="flex-1"
        style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
      >
        <View className="items-center mb-12">
          <Text className="text-5xl font-bold text-white mb-3">BrailleWalk</Text>
          <Text className="text-base text-white opacity-80">Your AI-powered vision assistant.</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg text-white font-medium mb-16 text-center opacity-90">What do you want to do next?</Text>

          <View className="flex-row items-center justify-center gap-8 mb-12">
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                className={`items-center ${
                  selectedFeature === feature.id ? 'opacity-70' : 'opacity-100'
                }`}
                onPress={() => handleFeaturePress(feature)}
                accessibilityLabel={feature.title}
                accessibilityHint={feature.description}
              >
                <View 
                  className="w-24 h-24 rounded-full bg-white items-center justify-center mb-3 border-4"
                  style={{ borderColor: selectedFeature === feature.id ? feature.color : 'transparent' }}
                >
                  {feature.icon}
                </View>
                <Text className="text-sm text-white font-semibold text-center">{feature.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="items-center gap-4">
          <TouchableOpacity
            onPress={handleRepeatInstructions}
            className="flex-row items-center gap-2 py-3 px-6 bg-white/10 rounded-full border border-white/20"
            accessibilityLabel="Repeat instructions"
            accessibilityHint="Tap to hear the available options again"
          >
            <MaterialIcons name="volume-up" size={22} color="#FFFFFF" />
            <Text className="text-sm text-white font-medium">Repeat instructions</Text>
          </TouchableOpacity>

          <Waveform isActive={isListening} />

          <Text className="text-sm text-white opacity-70 text-center px-8">
            {selectedFeature ? 'Loading feature...' : 'Tap any feature above to get started'}
          </Text>
        </View>

        {/* Voice Command Listener */}
        <VoiceCommandListener
          onCommand={handleVoiceCommand}
          enabled={true}
          wakeWord="hey"
          showVisualFeedback={true}
        />
      </View>
    </GradientBackground>
  );
}

