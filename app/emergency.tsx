import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import GradientBackground from '@/components/GradientBackground';

type EmergencyState = 'selecting' | 'sending-location' | 'calling' | 'in-call' | 'ended' | 'message-sent';
type EmergencyType = 'medical' | 'navigation' | 'general' | 'urgent';

interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  lastContact?: number;
}

interface EmergencyMessage {
  type: EmergencyType;
  message: string;
  location?: Location.LocationObject;
  timestamp: number;
}

const mockContacts: Contact[] = [
  { id: '1', name: 'UWIMANA Lucy', phone: '0788811121', relationship: 'Primary Caregiver', isPrimary: true },
  { id: '2', name: 'HABIMANA Bill', phone: '0780000012', relationship: 'Family Member', isPrimary: false },
  { id: '3', name: 'MUKARUTESI Kelly', phone: '0780121292', relationship: 'Emergency Contact', isPrimary: false },
];

const emergencyMessages = {
  medical: 'Medical emergency assistance needed. Please help immediately.',
  navigation: 'Navigation assistance needed. I may be lost or need help finding my way.',
  general: 'I need help. Please contact me as soon as possible.',
  urgent: 'URGENT: Immediate assistance required. Please respond quickly.'
};

export default function EmergencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [emergencyState, setEmergencyState] = useState<EmergencyState>('selecting');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('general');
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencyMessage[]>([]);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initializeLocation();
    const welcomeMessage = 'Emergency mode activated. You can contact your caregivers, send emergency messages, or make urgent calls. Choose your emergency contact.';
    if (Platform.OS !== 'web') {
      try {
        Speech.stop();
        Speech.speak(welcomeMessage, { rate: 0.7 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
        Vibration.vibrate([0, 200, 100, 200, 100, 200]);
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
      if (Platform.OS !== 'web') {
        try { Speech.stop(); } catch { }
      }
    };
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(location);
      }
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const handleSelectContact = async (contact: Contact) => {
    setSelectedContact(contact);
    
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
        Speech.stop();
        Speech.speak(`Selected ${contact.name}, ${contact.relationship}`);
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }
    
    await sendEmergencyMessage(contact);
  };

  const sendEmergencyMessage = async (contact: Contact) => {
    setEmergencyState('sending-location');
    
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
    
    const message = emergencyMessages[emergencyType];
    
    if (Platform.OS !== 'web') {
      try {
        Speech.stop();
        Speech.speak(`Sending emergency message and location to ${contact.name}`);
      } catch (error) {
        console.log('Speech not available:', error);
      }
    }
    const emergencyMessage: EmergencyMessage = {
      type: emergencyType,
      message,
      location: currentLocation || undefined,
      timestamp: Date.now()
    };
    setEmergencyHistory(prev => [emergencyMessage, ...prev.slice(0, 9)]);
    locationTimeoutRef.current = setTimeout(async () => {
      setEmergencyState('message-sent');
      if (Platform.OS !== 'web') {
        try {
          Speech.stop();
          Speech.speak(`Emergency message sent to ${contact.name}. Now initiating call.`);
        } catch (error) {
          console.log('Speech not available:', error);
        }
      }
      setTimeout(() => {
        initiateCall(contact);
      }, 2000);
    }, 3000) as ReturnType<typeof setTimeout>;
  };

  const initiateCall = (contact: Contact) => {
    setEmergencyState('calling');
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => { });
        Speech.stop();
        Speech.speak(`Calling ${contact.name}...`);
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }
    setTimeout(() => {
      setEmergencyState('in-call');
      if (Platform.OS !== 'web') {
        try {
          Speech.stop();
          Speech.speak(`Connected with ${contact.name}. Call in progress.`);
        } catch (error) {
          console.log('Speech not available:', error);
        }
      }
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000) as ReturnType<typeof setInterval>;
      if (Platform.OS !== 'web') {
        Linking.openURL(`tel:${contact.phone}`);
      }
    }, 3000);
  };

  const handleEndCall = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setEmergencyState('ended');
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        Speech.stop();
        Speech.speak(`Call ended. Duration: ${Math.floor(callDuration / 60)} minutes ${callDuration % 60} seconds.`);
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }
    setTimeout(() => router.back(), 3000);
  };

  const handleQuit = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
        Speech.stop();
        Speech.speak('Exiting emergency mode');
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }
    router.back();
  };

  const handleEmergencyTypeChange = (type: EmergencyType) => {
    setEmergencyType(type);
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        Speech.stop();
        Speech.speak(`Emergency type: ${type}. ${emergencyMessages[type]}`);
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSendingLocation = () => (
    <>
      <Text className="text-xl text-white font-semibold mb-7.5 text-center">Emergency Contact</Text>
      <View className="mb-15">
        <View className="w-60 h-60 rounded-full bg-white/15 items-center justify-center border-3 border-white">
          <Ionicons name="location" size={80} color="#FFFFFF" />
        </View>
      </View>
      <Text className="text-2xl text-white font-semibold text-center px-8 mb-5">Sending GPS location to the caregiver.</Text>
    </>
  );

  const renderCalling = () => (
    <>
      <Text className="text-xl text-white font-semibold mb-7.5 text-center">Emergency Contact</Text>
      <View className="mb-15">
        <View className="w-60 h-60 rounded-full bg-white/15 items-center justify-center border-3 border-white">
          <Ionicons name="call" size={80} color="#FFFFFF" />
        </View>
      </View>
      <Text className="text-2xl text-white font-semibold text-center px-8 mb-5">Calling...</Text>
    </>
  );

  const renderInCall = () => (
    <>
      <Text className="text-xl text-white font-semibold mb-7.5 text-center">{selectedContact?.name || 'Emergency Contact'}</Text>
      <View className="mb-15">
        <View className="w-60 h-60 rounded-full bg-white/15 items-center justify-center border-3 border-white">
          <Text className="text-8xl">🎤</Text>
        </View>
      </View>
      <Text className="text-2xl text-white font-semibold text-center px-8 mb-5">
        Call in progress - Duration: {formatCallDuration(callDuration)}
      </Text>
      <View className="items-center mb-5">
        <TouchableOpacity className="w-16 h-16 rounded-full bg-red-500 items-center justify-center" onPress={handleEndCall}>
          <Ionicons name="call-outline" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      {currentLocation && (
        <View className="flex-row items-center gap-2 px-5 py-3 bg-white/10 rounded-2xl mt-2.5">
          <Ionicons name="location-outline" size={16} color="#FFFFFF" />
          <Text className="text-xs text-white opacity-70 flex-1">
            Location shared: {currentLocation.coords.latitude.toFixed(4)}, {currentLocation.coords.longitude.toFixed(4)}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <GradientBackground>
      <View 
        className="flex-1"
        style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
      >
        {/* your previous renderContactSelection, renderEnded, etc remain same */}
      </View>
    </GradientBackground>
  );
}