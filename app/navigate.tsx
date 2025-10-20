import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, Vibration, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import GradientBackground from '@/components/GradientBackground';
import Waveform from '@/components/Waveform';


//screen responsible for navigation


type NavigationState = 'waiting' | 'navigating' | 'turning' | 'obstacle' | 'arrived' | 'paused';
type ObstacleType = 'person' | 'vehicle' | 'object' | 'stairs' | 'curb' | null;

interface NavigationInstruction {
  id: string;
  text: string;
  distance?: number;
  direction?: 'left' | 'right' | 'straight';
  type: NavigationState;
  priority: 'high' | 'medium' | 'low';
}

export default function NavigateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [navState, setNavState] = useState<NavigationState>('waiting');
  const [instruction, setInstruction] = useState<string>('Initializing navigation system...');
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [obstacleType, setObstacleType] = useState<ObstacleType>(null);
  const [distanceToDestination, setDistanceToDestination] = useState<number>(0);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navigationInstructions: NavigationInstruction[] = [
    { id: '1', text: 'Navigation system activated. Starting route to destination.', type: 'navigating', priority: 'medium' },
    { id: '2', text: 'Continue straight for 50 meters.', type: 'navigating', priority: 'low' },
    { id: '3', text: 'Turn right in 10 meters.', direction: 'right', distance: 10, type: 'turning', priority: 'high' },
    { id: '4', text: 'Person detected ahead. Please slow down.', type: 'obstacle', priority: 'high' },
    { id: '5', text: 'Continue straight for 30 meters.', type: 'navigating', priority: 'low' },
    { id: '6', text: 'Stairs detected ahead. Use handrail for safety.', type: 'obstacle', priority: 'high' },
    { id: '7', text: 'Turn left in 5 meters.', direction: 'left', distance: 5, type: 'turning', priority: 'high' },
    { id: '8', text: 'You have arrived at your destination.', type: 'arrived', priority: 'medium' },
  ];

  useEffect(() => {
    initializeLocation();
    startNavigationSequence();
    
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (Platform.OS !== 'web') {
        try { Speech.stop(); } catch {}
      }
    };
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
        if (Platform.OS !== 'web') {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            Speech.speak('Location services activated. Navigation ready.', { rate: 0.7 });
          } catch (error) {
            console.log('Native modules not available:', error);
          }
        }
      }
    } catch (error) {
      console.log('Location error:', error);
      if (Platform.OS !== 'web') {
        try {
          Speech.speak('Navigation mode activated with limited location features.', { rate: 0.7 });
        } catch (err) {
          console.log('Speech not available:', err);
        }
      }
    }
  };

  const startNavigationSequence = () => {
    let instructionIndex = 0;
    
    const processInstruction = () => {
      if (instructionIndex >= navigationInstructions.length) return;
      
      const currentInstruction = navigationInstructions[instructionIndex];
      setNavState(currentInstruction.type);
      setInstruction(currentInstruction.text);
      setDirection(
        currentInstruction.direction === 'left' || currentInstruction.direction === 'right'
          ? currentInstruction.direction
          : null
      );
      
      if (currentInstruction.type === 'obstacle') {
        const obstacleTypes: ObstacleType[] = ['person', 'vehicle', 'object', 'stairs', 'curb'];
        setObstacleType(obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)]);
      } else {
        setObstacleType(null);
      }
      
      if (Platform.OS !== 'web') {
        try {
          if (currentInstruction.priority === 'high') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            Vibration.vibrate([0, 200, 100, 200]);
          } else if (currentInstruction.priority === 'medium') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          
          Speech.stop();
          Speech.speak(currentInstruction.text, { rate: 0.6 });
        } catch (error) {
          console.log('Native modules not available:', error);
        }
      }
      instructionIndex++;
      
      speechTimeoutRef.current = setTimeout(processInstruction, 4000);
    };
    
    processInstruction();
  };

  const handleQuit = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        Speech.stop();
        Speech.speak('Exiting navigation mode');
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }
    router.back();
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
    
    if (isPaused) {
      if (Platform.OS !== 'web') {
        try {
          Speech.stop();
          Speech.speak('Navigation resumed');
        } catch (error) {
          console.log('Speech not available:', error);
        }
      }
      startNavigationSequence();
    } else {
      if (Platform.OS !== 'web') {
        try {
          Speech.stop();
          Speech.speak('Navigation paused');
        } catch (error) {
          console.log('Speech not available:', error);
        }
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    }
  };

  const handleRepeatInstruction = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        Speech.stop();
        Speech.speak(instruction, { rate: 0.6 });
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }
  };

  const getIcon = () => {
    switch (navState) {
      case 'turning':
        return direction === 'left' ? (
          <MaterialIcons name="arrow-back" size={80} color="#FFFFFF" />
        ) : (
          <MaterialIcons name="arrow-forward" size={80} color="#FFFFFF" />
        );
      case 'obstacle':
        return <MaterialIcons name="warning" size={80} color="#EF4444" />;
      case 'arrived':
        return <MaterialIcons name="check-circle" size={80} color="#10B981" />;
      case 'paused':
        return <MaterialIcons name="pause" size={80} color="#F59E0B" />;
      default:
        return <MaterialIcons name="navigation" size={80} color="#FFFFFF" />;
    }
  };

  const getStatusColor = () => {
    switch (navState) {
      case 'obstacle':
        return '#EF4444';
      case 'arrived':
        return '#10B981';
      case 'paused':
        return '#F59E0B';
      default:
        return '#FFFFFF';
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
          <Text style={styles.modeText}>Navigation mode active</Text>

          <View style={styles.compassContainer}>
            <View style={[styles.compassCircle, { borderColor: getStatusColor() }]}>
              {getIcon()}
            </View>
          </View>

          <Text style={[styles.instruction, { color: getStatusColor() }]}>{instruction}</Text>
          
          {currentLocation && (
            <View style={styles.locationInfo}>
              <MaterialIcons name="location-on" size={16} color="#FFFFFF" style={{ opacity: 0.7 }} />
              <Text style={styles.locationText}>
                Location: {currentLocation.coords.latitude.toFixed(4)}, {currentLocation.coords.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.controlButtons}>
            <TouchableOpacity
              onPress={handleRepeatInstruction}
              style={styles.controlButton}
              accessibilityLabel="Repeat instruction"
              accessibilityHint="Repeat the current navigation instruction"
            >
              <MaterialIcons name="volume-up" size={20} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>Repeat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handlePauseResume}
              style={styles.controlButton}
              accessibilityLabel={isPaused ? "Resume navigation" : "Pause navigation"}
              accessibilityHint={isPaused ? "Resume navigation" : "Pause navigation"}
            >
              {isPaused ? <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" /> : <MaterialIcons name="pause" size={20} color="#FFFFFF" />}
              <Text style={styles.controlButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
          </View>
          
          <Waveform isActive={navState !== 'arrived' && !isPaused} />
          
          <TouchableOpacity
            onPress={handleQuit}
            style={styles.quitButton}
            accessibilityLabel="Quit navigation"
            accessibilityHint="Exit navigation mode"
          >
            <Text style={styles.quitText}>Exit Navigation</Text>
          </TouchableOpacity>
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
    marginBottom: 40,
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
  modeText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    marginBottom: 60,
  },
  compassContainer: {
    marginBottom: 60,
  },
  compassCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  instruction: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginTop: 10,
  },
  locationText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    gap: 16,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500' as const,
  },
  quitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  quitText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
});