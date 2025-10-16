import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Navigation, Scan, Phone, Settings, Volume2 } from 'lucide-react-native';
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
      icon: <Navigation size={32} color="#0047AB" strokeWidth={2} />,
      route: '/navigate',
      color: '#10B981'
    },
    {
      id: 'scan',
      title: 'Scan Object',
      description: 'Read text, identify objects, and describe your surroundings',
      icon: <Scan size={32} color="#0047AB" strokeWidth={2} />,
      route: '/scan',
      color: '#3B82F6'
    },
    {
      id: 'emergency',
      title: 'I need help',
      description: 'Contact your caregiver and share your location',
      icon: <Phone size={32} color="#0047AB" strokeWidth={2} />,
      route: '/emergency',
      color: '#EF4444'
    }
  ];

  useEffect(() => {
    const welcomeMessage = 'Welcome to BrailleWalk dashboard. You have three main features available: Navigate for walking guidance, Scan Object for reading text and identifying objects, and I need help for emergency contacts. Tap any feature to get started.';
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
    
    const featureMessage = feature.id === 'navigate' 
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
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>BrailleWalk</Text>
          <Text style={styles.subtitle}>Your AI-powered vision assistant.</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.prompt}>What do you want to do next?</Text>

          <View style={styles.buttonContainer}>
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={[
                  styles.button,
                  selectedFeature === feature.id && styles.selectedButton,
                  { borderLeftColor: feature.color }
                ]}
                onPress={() => handleFeaturePress(feature)}
                accessibilityLabel={feature.title}
                accessibilityHint={feature.description}
                disabled={selectedFeature !== null && selectedFeature !== feature.id}
              >
                <View style={styles.buttonContent}>
                  <View style={styles.iconContainer}>
                    {feature.icon}
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.buttonText}>{feature.title}</Text>
                    <Text style={styles.buttonDescription}>{feature.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            onPress={handleRepeatInstructions}
            style={styles.repeatButton}
            accessibilityLabel="Repeat instructions"
            accessibilityHint="Tap to hear the available options again"
          >
            <Volume2 size={20} color="#FFFFFF" />
            <Text style={styles.repeatText}>Repeat instructions</Text>
          </TouchableOpacity>
          
          <Waveform isActive={isListening} />
          
          <Text style={styles.tapText}>
            {selectedFeature ? 'Loading feature...' : 'Tap any feature above to get started'}
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  prompt: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    maxWidth: 400,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderLeftWidth: 6,
    opacity: 1,
  },
  selectedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    transform: [{ scale: 0.98 }],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 71, 171, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0047AB',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
    color: '#0047AB',
    opacity: 0.7,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    gap: 16,
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  repeatText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500' as const,
  },
  listeningText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  tapText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
  },
});
