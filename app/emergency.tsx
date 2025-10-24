import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import GradientBackground from '@/components/GradientBackground';
import VoiceCommandListener from '@/components/VoiceCommandListener';
import { matchCommand, getSuggestions, EMERGENCY_COMMANDS, matchContactName, parseComplexCommand } from '@/utils/commandMatcher';

type EmergencyState = 'selecting' | 'sending-location' | 'calling' | 'in-call' | 'ended' | 'message-sent';
type EmergencyType = 'medical' | 'navigation' | 'general' | 'urgent';

interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  lastContact?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  distance?: number; // Distance in kilometers from user
}

interface EmergencyMessage {
  type: EmergencyType;
  message: string;
  location?: Location.LocationObject;
  timestamp: number;
}

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'UWIMANA Lucy',
    phone: '0788811121',
    relationship: 'Primary Caregiver',
    isPrimary: true,
    location: { latitude: -1.9441, longitude: 30.0619, address: 'Kigali, Gasabo District' }
  },
  {
    id: '2',
    name: 'HABIMANA Bill',
    phone: '0780000012',
    relationship: 'Family Member',
    isPrimary: false,
    location: { latitude: -1.9536, longitude: 30.0606, address: 'Kigali, Kicukiro District' }
  },
  {
    id: '3',
    name: 'MUKARUTESI Kelly',
    phone: '0780121292',
    relationship: 'Emergency Contact',
    isPrimary: false,
    location: { latitude: -1.9706, longitude: 30.1044, address: 'Kigali, Nyarugenge District' }
  },
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
  const [sortedContacts, setSortedContacts] = useState<Contact[]>(mockContacts);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencyMessage[]>([]);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initializeLocation();
    const welcomeMessage = 'Emergency mode activated. You can contact your caregivers, send emergency messages, or make urgent calls. Choose your emergency contact.';
    if (Platform.OS !== 'web') {
      try {
        Speech.speak(welcomeMessage, { rate: 1, language: 'en-US' });
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

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);

        // Calculate distances and sort contacts by proximity
        const contactsWithDistance = mockContacts.map(contact => {
          if (contact.location) {
            const distance = calculateDistance(
              location.coords.latitude,
              location.coords.longitude,
              contact.location.latitude,
              contact.location.longitude
            );
            return { ...contact, distance };
          }
          return contact;
        });

        // Sort by distance (nearest first), then by isPrimary
        const sorted = contactsWithDistance.sort((a, b) => {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return 0;
        });

        setSortedContacts(sorted);
        console.log('Contacts sorted by distance:', sorted.map(c => ({ name: c.name, distance: c.distance?.toFixed(2) })));
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
        Speech.speak(`Selected ${contact.name}, ${contact.relationship}`, { rate: 1, language: 'en-US' });
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
        Speech.speak(`Sending emergency message and location to ${contact.name}`, { rate: 1, language: 'en-US' });
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
          Speech.speak(`Emergency message sent to ${contact.name}. Now initiating call.`, {
            rate: 1,
            language: 'en-US',
            onDone: () => {
              // Initiate call immediately after speech finishes
              initiateCall(contact);
            },
            onError: () => {
              // If speech fails, initiate call after 1 second
              setTimeout(() => {
                initiateCall(contact);
              }, 1000);
            }
          });
        } catch (error) {
          console.log('Speech not available:', error);
          // If speech module not available, initiate call after 1 second
          setTimeout(() => {
            initiateCall(contact);
          }, 1000);
        }
      } else {
        // Web platform - no speech, initiate call after 1 second
        setTimeout(() => {
          initiateCall(contact);
        }, 1000);
      }
    }, 3000) as ReturnType<typeof setTimeout>;
  };

  const initiateCall = (contact: Contact) => {
    setEmergencyState('calling');
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => { });
        Speech.speak(`Calling ${contact.name}...`, {
          rate: 1,
          language: 'en-US',
          onDone: () => {
            // Connect call immediately after speech finishes
            setEmergencyState('in-call');
            if (Platform.OS !== 'web') {
              try {
                Speech.speak(`Connected with ${contact.name}. Call in progress.`, { rate: 1, language: 'en-US' });
              } catch (error) {
                console.log('Speech not available:', error);
              }
            }
            setCallDuration(0);
            callTimerRef.current = setInterval(() => {
              setCallDuration(prev => prev + 1);
            }, 1000) as ReturnType<typeof setInterval>;

          },
          onError: () => {
            // If speech fails, connect after 2 seconds
            setTimeout(() => {
              setEmergencyState('in-call');
              if (Platform.OS !== 'web') {
                try {
                  Speech.speak(`Connected with ${contact.name}. Call in progress.`, { rate: 1, language: 'en-US' });
                } catch (error) {
                  console.log('Speech not available:', error);
                }
              }
              setCallDuration(0);
              callTimerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
              }, 1000) as ReturnType<typeof setInterval>;

            }, 2000);
          }
        });
      } catch (error) {
        console.log('Native modules not available:', error);
        // If speech module not available, connect after 2 seconds
        setTimeout(() => {
          setEmergencyState('in-call');
          setCallDuration(0);
          callTimerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
          }, 1000) as ReturnType<typeof setInterval>;

        }, 2000);
      }
    } else {
      // Web platform - no speech, connect after 2 seconds
      setTimeout(() => {
        setEmergencyState('in-call');
        setCallDuration(0);
        callTimerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000) as ReturnType<typeof setInterval>;
      }, 2000);
    }
  };

  const handleEndCall = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setEmergencyState('ended');
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
        Speech.speak(`Call ended. Duration: ${Math.floor(callDuration / 60)} minutes ${callDuration % 60} seconds.`, {
          rate: 1,
          language: 'en-US',
          onDone: () => {
            // Go back immediately after speech finishes
            router.back();
          },
          onError: () => {
            // If speech fails, go back after 2 seconds
            setTimeout(() => router.back(), 2000);
          }
        });
      } catch (error) {
        console.log('Native modules not available:', error);
        // If speech module not available, go back after 2 seconds
        setTimeout(() => router.back(), 2000);
      }
    } else {
      // Web platform - no speech, go back after 2 seconds
      setTimeout(() => router.back(), 2000);
    }
  };

  const handleQuit = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
        Speech.speak('Exiting emergency mode', { rate: 1 });
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
        Speech.speak(`Emergency type: ${type}. ${emergencyMessages[type]}`, { rate: 1, language: 'en-US' });
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

  const handleVoiceCommand = (command: string, confidence?: number) => {
    // Parse complex commands (e.g., "call John")
    const parsed = parseComplexCommand(command, EMERGENCY_COMMANDS);
    
    // Check for call first/nearest command
    const match = matchCommand(command, EMERGENCY_COMMANDS, 0.6);
    
    if (match && match.command === 'call_first' && emergencyState === 'selecting') {
      // Call first/nearest contact
      if (sortedContacts.length > 0) {
        console.log(`Calling first contact: ${sortedContacts[0].name}`);
        handleSelectContact(sortedContacts[0]);
      }
    }
    else if (parsed.action === 'call_first' && parsed.parameter && emergencyState === 'selecting') {
      // Try to match contact name with fuzzy matching
      const contactNames = sortedContacts.map(c => c.name);
      const nameMatch = matchContactName(parsed.parameter, contactNames, 0.6);
      
      if (nameMatch.name) {
        const matchedContact = sortedContacts.find(c => c.name === nameMatch.name);
        if (matchedContact) {
          console.log(`Matched contact: ${matchedContact.name} (confidence: ${nameMatch.confidence})`);
          handleSelectContact(matchedContact);
        }
      } else {
        // No match found - provide suggestions
        const suggestions = contactNames.slice(0, 2);
        const errorMessage = `I couldn't find that contact. Available contacts are: ${suggestions.join(', and ')}.`;
        if (Platform.OS !== 'web') {
          Speech.speak(errorMessage, { rate: 1, language: 'en-US' });
        }
        console.log(`Contact not found: "${parsed.parameter}". Available: ${contactNames.join(', ')}`);
      }
    }
    else if (match && match.command === 'end_call' && emergencyState === 'in-call') {
      handleEndCall();
    }
    else if (match && match.command === 'back' && 
             emergencyState !== 'in-call' && emergencyState !== 'calling' && emergencyState !== 'sending-location') {
      handleQuit();
    }
    else {
      // Command not recognized - provide context-aware help
      let errorMessage = "I didn't understand that. ";
      
      if (emergencyState === 'selecting') {
        const suggestions = getSuggestions(command, EMERGENCY_COMMANDS, 3);
        if (suggestions.length > 0) {
          errorMessage += `Try saying: ${suggestions.slice(0, 2).join(', or ')}.`;
        } else {
          errorMessage += "Say 'call' followed by a contact name, or 'call first' for nearest contact.";
        }
      } else if (emergencyState === 'in-call') {
        errorMessage = "Say 'end call' to hang up.";
      }
      
      if (Platform.OS !== 'web') {
        Speech.speak(errorMessage, { rate: 1, language: 'en-US' });
      }
      
      console.log(`Command not recognized: "${command}" in state: ${emergencyState}`);
    }
  };

  const renderSendingLocation = () => (
    <View className="items-center gap-y-6">
      <Text className="text-lg text-white font-medium text-center opacity-90">Emergency Contact</Text>
      <View className="w-64 h-64 rounded-full bg-white/10 items-center justify-center border-4 border-white">
        <Ionicons name="location" size={120} color="#FFFFFF" />
      </View>
      <Text className="text-xl text-white font-semibold text-center px-8">Sending GPS location to the caregiver.</Text>
    </View>
  );

  const renderMessageSent = () => (
    <View className="items-center gap-y-6">
      <Text className="text-lg text-white font-medium text-center opacity-90">Message Sent</Text>
      <View className="w-64 h-64 rounded-full bg-white/10 items-center justify-center border-4 border-green-500">
        <Ionicons name="checkmark-circle" size={120} color="#10B981" />
      </View>
      <View className="gap-y-2">
        <Text className="text-xl text-white font-semibold text-center px-8">
          Emergency message sent to {selectedContact?.name}
        </Text>
        <Text className="text-base text-white text-center opacity-80 px-8">
          Initiating call...
        </Text>
      </View>
    </View>
  );

  const renderCalling = () => (
    <View className="items-center gap-y-6">
      <Text className="text-lg text-white font-medium text-center opacity-90">Ringing</Text>
      <View className="w-64 h-64 rounded-full bg-white/10 items-center justify-center border-4 border-white">
        <Ionicons name="call" size={120} color="#FFFFFF" />
      </View>
      <Text className="text-xl text-white font-semibold text-center px-8">Calling {selectedContact?.name}...</Text>
    </View>
  );

  const renderInCall = () => (
    <View className="items-center gap-y-6">
      <Text className="text-lg text-white font-medium text-center opacity-90">{selectedContact?.name || 'Emergency Contact'}</Text>
      <View className="w-64 h-64 rounded-full bg-white/10 items-center justify-center border-4 border-green-500">
        <Ionicons name="mic" size={120} color="#10B981" />
      </View>
      <View className="gap-y-4 items-center">
        <Text className="text-xl text-white font-semibold text-center px-8">
          Call in progress
        </Text>
        <Text className="text-2xl text-white font-bold text-center">
          {formatCallDuration(callDuration)}
        </Text>
      </View>
      <TouchableOpacity
        className="w-20 h-20 rounded-full bg-red-500 items-center justify-center border-4 border-red-600"
        onPress={handleEndCall}
        accessibilityLabel="End call"
      >
        <Ionicons name="call" size={40} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
      </TouchableOpacity>
    </View>
  );

  return (
    <GradientBackground>
      <View
        className="flex-1 gap-y-4"
        style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
      >
        <View className="items-center gap-y-2">
          <Text className="text-5xl font-bold text-white">BrailleWalk</Text>
          <Text className="text-base text-white opacity-80">Your AI-powered vision assistant.</Text>
        </View>

        <View className="items-center justify-center px-6 gap-y-6">
          {emergencyState === 'selecting' && (
            <View className="items-center gap-y-6 w-full">
              <Text className="text-lg text-white font-medium text-center opacity-90">Select Emergency Contact</Text>
              <View className="w-full gap-4 max-w-sm">
                {sortedContacts.map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    className="bg-white py-5 px-6 rounded-2xl border-l-6 border-red-500"
                    onPress={() => handleSelectContact(contact)}
                    accessibilityLabel={`Call ${contact.name}`}
                    accessibilityHint={`Emergency contact: ${contact.relationship}`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text className="text-lg font-bold text-gray-900">{contact.name}</Text>
                          {contact.distance !== undefined && (
                            <View className="bg-blue-100 px-2 py-1 rounded-full">
                              <Text className="text-xs font-semibold text-blue-700">
                                {contact.distance < 1
                                  ? `${(contact.distance * 1000).toFixed(0)}m`
                                  : `${contact.distance.toFixed(1)}km`}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-sm text-gray-600">{contact.relationship}</Text>
                        {contact.location?.address && (
                          <Text className="text-xs text-gray-500 mt-1">{contact.location.address}</Text>
                        )}
                        <Text className="text-xs text-gray-500 mt-1">{contact.phone}</Text>
                      </View>
                      <View className="ml-4">
                        <Ionicons name="call" size={32} color="#EF4444" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {emergencyState === 'sending-location' && renderSendingLocation()}
          {emergencyState === 'message-sent' && renderMessageSent()}
          {emergencyState === 'calling' && renderCalling()}
          {emergencyState === 'in-call' && renderInCall()}
          {emergencyState === 'ended' && (
            <View className="items-center gap-y-6">
              <Text className="text-lg text-white font-medium text-center opacity-90">Call Ended</Text>
              <View className="w-64 h-64 rounded-full bg-white/10 items-center justify-center border-4 border-green-500">
                <Ionicons name="checkmark-circle" size={120} color="#10B981" />
              </View>
              <View className="gap-y-2">
                <Text className="text-xl text-white font-semibold text-center px-8">
                  Call ended successfully
                </Text>
                <Text className="text-base text-white text-center opacity-80">
                  Duration: {formatCallDuration(callDuration)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View className="items-center">
          {emergencyState !== 'in-call' && emergencyState !== 'calling' && emergencyState !== 'sending-location' && (
            <TouchableOpacity
              onPress={handleQuit}
              className="py-3 px-8 bg-white/10 rounded-full border border-white/20"
              accessibilityLabel="Go back"
              accessibilityHint="Return to dashboard"
            >
              <Text className="text-base text-white font-semibold">Go Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Voice Command Listener */}
        <VoiceCommandListener
          onCommand={handleVoiceCommand}
          enabled={emergencyState !== 'sending-location' && emergencyState !== 'message-sent' && emergencyState !== 'calling' && emergencyState !== 'ended'}
          wakeWord="hey"
          showVisualFeedback={true}
        />
      </View>
    </GradientBackground>
  );
}