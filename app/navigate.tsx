import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Vibration, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import GradientBackground from '@/components/GradientBackground';
import Waveform from '@/components/Waveform';

// Screen responsible for navigation


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
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      
      speechTimeoutRef.current = setTimeout(processInstruction, 4000) as ReturnType<typeof setTimeout>;
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
      <View 
        className="flex-1"
        style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
      >
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-white mb-2">BrailleWalk</Text>
          <Text className="text-base text-white opacity-90">Your AI-powered vision assistant.</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl text-white font-semibold mb-15">Navigation mode active</Text>

          <View className="mb-15">
            <View 
              className="w-60 h-60 rounded-full bg-white/15 items-center justify-center border-3"
              style={{ borderColor: getStatusColor() }}
            >
              {getIcon()}
            </View>
          </View>

          <Text 
            className="text-2xl font-semibold text-center px-8 mb-5"
            style={{ color: getStatusColor() }}
          >{instruction}</Text>
          
          {currentLocation && (
            <View className="flex-row items-center gap-2 px-5 py-3 bg-white/10 rounded-2xl mt-2.5">
              <MaterialIcons name="location-on" size={16} color="#FFFFFF" style={{ opacity: 0.7 }} />
              <Text className="text-xs text-white opacity-70 flex-1">
                Location: {currentLocation.coords.latitude.toFixed(4)}, {currentLocation.coords.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        <View className="items-center gap-4">
          <View className="flex-row gap-4 mb-2.5">
            <TouchableOpacity
              onPress={handleRepeatInstruction}
              className="flex-row items-center gap-1.5 py-2.5 px-4 bg-white/10 rounded-2xl border border-white/20"
              accessibilityLabel="Repeat instruction"
              accessibilityHint="Repeat the current navigation instruction"
            >
              <MaterialIcons name="volume-up" size={20} color="#FFFFFF" />
              <Text className="text-sm text-white font-medium">Repeat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handlePauseResume}
              className="flex-row items-center gap-1.5 py-2.5 px-4 bg-white/10 rounded-2xl border border-white/20"
              accessibilityLabel={isPaused ? "Resume navigation" : "Pause navigation"}
              accessibilityHint={isPaused ? "Resume navigation" : "Pause navigation"}
            >
              {isPaused ? <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" /> : <MaterialIcons name="pause" size={20} color="#FFFFFF" />}
              <Text className="text-sm text-white font-medium">{isPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
          </View>
          
          <Waveform isActive={navState !== 'arrived' && !isPaused} />
          
          <TouchableOpacity
            onPress={handleQuit}
            className="py-3 px-6 bg-red-500/20 rounded-3xl border border-red-500/40"
            accessibilityLabel="Quit navigation"
            accessibilityHint="Exit navigation mode"
          >
            <Text className="text-base text-white font-semibold">Exit Navigation</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}
