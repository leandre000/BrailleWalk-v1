import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Linking, Platform, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import GradientBackground from '@/components/GradientBackground';
import Waveform from '@/components/Waveform';

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
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    }, 3000);
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
      }, 1000);
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
      <Text style={styles.modeText}>Emergency Contact</Text>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="location" size={80} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.instruction}>Sending GPS location to the caregiver.</Text>
    </>
  );

  const renderCalling = () => (
    <>
      <Text style={styles.modeText}>Emergency Contact</Text>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="call" size={80} color="#FFFFFF" />
        </View>
      </View>
      <Text style={styles.instruction}>Calling...</Text>
    </>
  );

  const renderInCall = () => (
    <>
      <Text style={styles.modeText}>{selectedContact?.name || 'Emergency Contact'}</Text>
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, styles.micCircle]}>
          <Text style={styles.micIcon}>🎤</Text>
        </View>
      </View>
      <Text style={styles.instruction}>
        Call in progress - Duration: {formatCallDuration(callDuration)}
      </Text>
      <View style={styles.callControls}>
        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
          <Ionicons name="call-outline" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      {currentLocation && (
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={16} color="#FFFFFF" />
          <Text style={styles.locationText}>
            Location shared: {currentLocation.coords.latitude.toFixed(4)}, {currentLocation.coords.longitude.toFixed(4)}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <GradientBackground>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* your previous renderContactSelection, renderEnded, etc remain same */}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, }, header: { alignItems: 'center', marginBottom: 40, }, title: { fontSize: 40, fontWeight: '700' as const, color: '#FFFFFF', marginBottom: 8, }, subtitle: { fontSize: 16, color: '#FFFFFF', opacity: 0.9, }, content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, }, modeText: { fontSize: 20, color: '#FFFFFF', fontWeight: '600' as const, marginBottom: 30, textAlign: 'center', }, emergencyTypeSelector: { marginBottom: 30, paddingHorizontal: 20, }, selectorLabel: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' as const, marginBottom: 12, textAlign: 'center', }, typeButtons: { flexDirection: 'row', gap: 8, justifyContent: 'center', }, typeButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', }, activeTypeButton: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF', }, typeButtonText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' as const, }, activeTypeButtonText: { color: '#0047AB', }, contactList: { width: '100%', maxWidth: 400, gap: 12, marginBottom: 30, }, contactButton: { backgroundColor: '#FFFFFF', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 20, borderWidth: 2, borderColor: 'transparent', }, primaryContactButton: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', }, contactHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, }, contactButtonText: { fontSize: 18, fontWeight: '700' as const, color: '#0047AB', }, primaryContactText: { color: '#92400E', }, primaryBadge: { fontSize: 10, color: '#92400E', backgroundColor: '#FCD34D', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, fontWeight: '600' as const, }, contactPhone: { fontSize: 14, color: '#0047AB', opacity: 0.7, marginBottom: 2, }, contactRelationship: { fontSize: 12, color: '#0047AB', opacity: 0.5, }, iconContainer: { marginBottom: 40, }, iconCircle: { width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255, 255, 255, 0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF', }, micCircle: { backgroundColor: 'rgba(255, 255, 255, 0.25)', }, micIcon: { fontSize: 80, }, instruction: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' as const, textAlign: 'center', paddingHorizontal: 32, }, callControls: { marginTop: 30, alignItems: 'center', }, endCallButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', }, locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 15, marginTop: 20, }, locationText: { fontSize: 12, color: '#FFFFFF', opacity: 0.7, flex: 1, }, emergencySummary: { marginTop: 20, padding: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 15, width: '100%', }, summaryTitle: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' as const, marginBottom: 12, textAlign: 'center', }, summaryText: { fontSize: 14, color: '#FFFFFF', opacity: 0.9, marginBottom: 4, lineHeight: 20, }, footer: { alignItems: 'center', gap: 16, }, quitButton: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 25, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.4)', }, quitText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' as const, }, });