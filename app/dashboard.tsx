import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

import GradientBackground from '@/components/GradientBackground';
import Waveform from '@/components/Waveform';

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
      icon: <Ionicons name="navigate" size={32} color="#0047AB" />,
      route: '/navigate',
      color: '#10B981'
    },
    {
      id: 'scan',
      title: 'Scan Object',
      description: 'Read text, identify objects, and describe your surroundings',
      icon: <Feather name="camera" size={32} color="#0047AB" />,
      route: '/scan',
      color: '#3B82F6'
    },
    {
      id: 'emergency',
      title: 'I need help',
      description: 'Contact your caregiver and share your location',
      icon: <Ionicons name="call" size={32} color="#0047AB" />,
      route: '/emergency',
      color: '#EF4444'
    }
  ];

  useEffect(() => {
    const welcomeMessage =
      'Welcome to BrailleWalk dashboard. You have three main features available: Navigate for walking guidance, Scan Object for reading text and identifying objects, and I need help for emergency contacts. Tap any feature to get started.';
    if (Platform.OS !== 'web') {
      try {
        Speech.speak(welcomeMessage, { rate: 0.7 });
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
        Speech.speak(featureMessage, { rate: 0.7 });
      } catch (error) {
        console.log('Speech not available:', error);
      }
    }

    setTimeout(() => {
      router.push(feature.route as any);
    }, 1500);
  };

  const handleRepeatInstructions = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    
    const instructionsMessage = 'Tap Navigate for walking guidance, Scan Object for reading text and identifying objects, or I need help for emergency contacts.';
    
    if (Platform.OS !== 'web') {
      try {
        Speech.speak(instructionsMessage, { rate: 0.7 });
      } catch (error) {
        console.log('Speech not available:', error);
      }
    }
  };

  return (
    <GradientBackground>
      <View 
        className="flex-1"
        style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
      >
        <View className="items-center mb-15">
          <Text className="text-4xl font-bold text-white mb-2">BrailleWalk</Text>
          <Text className="text-base text-white opacity-90">Your AI-powered vision assistant.</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl text-white font-semibold mb-10 text-center">What do you want to do next?</Text>

          <View className="w-full gap-4 max-w-sm">
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                className={`bg-white py-5 px-6 rounded-2xl border-l-6 opacity-100 ${
                  selectedFeature === feature.id ? 'bg-white/90 scale-98' : ''
                }`}
                style={{ borderLeftColor: feature.color }}
                onPress={() => handleFeaturePress(feature)}
                accessibilityLabel={feature.title}
                accessibilityHint={feature.description}
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-3xl bg-blue-900/10 items-center justify-center">{feature.icon}</View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-blue-900 mb-1">{feature.title}</Text>
                    <Text className="text-sm text-blue-900 opacity-70 leading-4">{feature.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="items-center gap-4">
          <TouchableOpacity
            onPress={handleRepeatInstructions}
            className="flex-row items-center gap-2 py-3 px-5 bg-white/10 rounded-3xl border border-white/20"
            accessibilityLabel="Repeat instructions"
            accessibilityHint="Tap to hear the available options again"
          >
            <MaterialIcons name="volume-up" size={20} color="#FFFFFF" />
            <Text className="text-sm text-white font-medium">Repeat instructions</Text>
          </TouchableOpacity>

          <Waveform isActive={isListening} />

          <Text className="text-sm text-white opacity-70 text-center">
            {selectedFeature ? 'Loading feature...' : 'Tap any feature above to get started'}
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
}

