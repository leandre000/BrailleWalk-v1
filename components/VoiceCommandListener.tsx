import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface VoiceCommandListenerProps {
    onCommand: (command: string, confidence?: number) => void;
    enabled?: boolean;
    wakeWord?: string;
    showVisualFeedback?: boolean;
    confirmBeforeExecute?: boolean;
}

export default function VoiceCommandListener({
    onCommand,
    enabled = true,
    wakeWord = 'hey',
    showVisualFeedback = true,
    confirmBeforeExecute = true,
}: VoiceCommandListenerProps) {
    const [isListening, setIsListening] = useState(false);
    const [isWaitingForCommand, setIsWaitingForCommand] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [confidence, setConfidence] = useState<number>(0);
    const wakeWordDetectedRef = useRef(false);

    // Request permissions on mount
    useEffect(() => {
        requestPermissions();
    }, []);

    const requestPermissions = async () => {
        try {
            const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            setPermissionGranted(result.granted);

            if (result.granted && enabled) {
                startContinuousListening();
            }
        } catch (error) {
            console.error('Permission error:', error);
        }
    };

    // Start continuous listening for wake word
    const startContinuousListening = async () => {
        if (!permissionGranted || Platform.OS === 'web') return;

        try {
            await ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: true,
                maxAlternatives: 1,
                continuous: true,
                requiresOnDeviceRecognition: false,
            });
            setIsListening(true);
        } catch (error) {
            console.error('Start listening error:', error);
        }
    };

    // Handle speech recognition results
    useSpeechRecognitionEvent('result', async (event) => {
        const transcript = event.results[0]?.transcript?.toLowerCase() || '';
        setRecognizedText(transcript);
        console.log(transcript)
        // Replace lines 70-87 with:
        if (!isWaitingForCommand && ['hey', 'okay'].some(word => transcript.includes(word))) {
            wakeWordDetectedRef.current = true;
            setIsWaitingForCommand(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Speech.speak('Yes, I am listening', { rate: 1, language: 'en-US' });

            // Stop continuous listening like tap does
            await ExpoSpeechRecognitionModule.stop();

            // Start command-specific listening
            await ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: false,
                maxAlternatives: 1,
                continuous: false
            });

            // Timeout after 5 seconds
            setTimeout(async () => {
                if (wakeWordDetectedRef.current) {
                    wakeWordDetectedRef.current = false;
                    setIsWaitingForCommand(false);
                    Speech.speak('Listening cancelled', { rate: 1, language: 'en-US' });
                    if (enabled) startContinuousListening();
                }
            }, 5000);
        }
        // Process command if waiting for command
        else if (isWaitingForCommand && event.isFinal) {
            wakeWordDetectedRef.current = false;
            setIsWaitingForCommand(false);
            processCommand(transcript);
        }
    });

    // Handle errors
    useSpeechRecognitionEvent('error', (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);

        // Restart listening after error
        setTimeout(() => {
            if (enabled && permissionGranted) {
                startContinuousListening();
            }
        }, 1000);
    });

    // Handle end of recognition
    useSpeechRecognitionEvent('end', () => {
        setIsListening(false);

        // Restart continuous listening
        if (enabled && permissionGranted && !isWaitingForCommand) {
            setTimeout(() => {
                startContinuousListening();
            }, 500);
        }
    });

    // Process voice command
    const processCommand = (text: string, confidenceScore: number = 1.0) => {
        const cleanText = text.trim().toLowerCase();

        // Remove wake word if still present
        const commandText = cleanText.replace(wakeWord.toLowerCase(), '').trim();

        if (commandText) {
            setConfidence(confidenceScore);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            // Provide voice confirmation if enabled
            if (confirmBeforeExecute) {
                const confidencePercent = Math.round(confidenceScore * 100);
                let confirmationMessage = '';
                
                if (confidenceScore >= 0.9) {
                    confirmationMessage = `Got it, ${commandText}`;
                } else if (confidenceScore >= 0.7) {
                    confirmationMessage = `I heard ${commandText}`;
                } else {
                    confirmationMessage = `I think you said ${commandText}`;
                }
                
                Speech.speak(confirmationMessage, { 
                    rate: 1.1, 
                    language: 'en-US',
                    onDone: () => {
                        onCommand(commandText, confidenceScore);
                    },
                    onError: () => {
                        // Execute anyway if speech fails
                        onCommand(commandText, confidenceScore);
                    }
                });
            } else {
                onCommand(commandText, confidenceScore);
            }
        }
    };

    // Manual tap to activate
    const handleTapToSpeak = async () => {
        if (!permissionGranted) {
            await requestPermissions();
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsWaitingForCommand(true);
        Speech.speak('Listening', { rate: 1, language: 'en-US' });

        // Stop continuous listening temporarily
        try {
            await ExpoSpeechRecognitionModule.stop();
        } catch (error) {
            console.error('Stop error:', error);
        }

        // Start single command recognition
        try {
            await ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: false,
                maxAlternatives: 1,
                continuous: false,
                requiresOnDeviceRecognition: false,
            });

            // Timeout after 5 seconds
            setTimeout(async () => {
                if (isWaitingForCommand) {
                    setIsWaitingForCommand(false);
                    try {
                        await ExpoSpeechRecognitionModule.stop();
                    } catch (error) {
                        console.error('Stop error:', error);
                    }
                    Speech.speak('Listening cancelled', { rate: 1, language: 'en-US' });

                    // Restart continuous listening
                    if (enabled) {
                        startContinuousListening();
                    }
                }
            }, 5000);
        } catch (error) {
            console.error('Manual listening error:', error);
            setIsWaitingForCommand(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            try {
                ExpoSpeechRecognitionModule.stop();
            } catch (error) {
                console.error('Cleanup error:', error);
            }
        };
    }, []);

    // Stop/start listening based on enabled prop
    useEffect(() => {
        if (!enabled && isListening) {
            try {
                ExpoSpeechRecognitionModule.stop();
            } catch (error) {
                console.error('Stop error:', error);
            }
            setIsListening(false);
        } else if (enabled && !isListening && permissionGranted) {
            startContinuousListening();
        }
    }, [enabled]);

    if (!showVisualFeedback) {
        return null;
    }

    return (
        <View className="absolute bottom-8 right-8 items-center">
            {/* Tap to speak button */}
            <Pressable
                onPress={handleTapToSpeak}
                className={`w-16 h-16 rounded-full items-center justify-center ${isWaitingForCommand ? 'bg-red-500' : 'bg-blue-500'
                    } shadow-lg`}
                accessibilityLabel="Tap to give voice command"
                accessibilityHint="Tap and speak your command"
            >
                <MaterialIcons
                    name={isWaitingForCommand ? 'mic' : 'mic-none'}
                    size={32}
                    color="white"
                />
            </Pressable>

            {/* Status indicator */}
            {isListening && !isWaitingForCommand && (
                <View className="mt-2 px-3 py-1 bg-green-500/80 rounded-full">
                    <Text className="text-white text-xs font-semibold">
                        Listening for "{wakeWord}"
                    </Text>
                </View>
            )}

            {isWaitingForCommand && (
                <View className="mt-2 px-3 py-1 bg-red-500/80 rounded-full">
                    <Text className="text-white text-xs font-semibold">
                        Speak now...
                    </Text>
                </View>
            )}

            {/* Debug: Show recognized text with confidence */}
            {recognizedText && isWaitingForCommand && (
                <View className="mt-2 px-3 py-1 bg-gray-800/80 rounded-lg max-w-xs">
                    <Text className="text-white text-xs">
                        {recognizedText}
                    </Text>
                    {confidence > 0 && (
                        <Text className="text-gray-400 text-xs mt-1">
                            {Math.round(confidence * 100)}% confident
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}
