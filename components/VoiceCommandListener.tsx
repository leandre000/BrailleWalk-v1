import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, Platform, Animated } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { speechManager } from '@/utils/speechManager';

interface VoiceCommandListenerProps {
    onCommand: (command: string, confidence?: number) => void;
    enabled?: boolean;
    continuousMode?: boolean;
    wakeWord?: string;
    showVisualFeedback?: boolean;
    confirmBeforeExecute?: boolean;
}

export default function VoiceCommandListener({
    onCommand,
    enabled = true,
    continuousMode = true,
    wakeWord = 'hey',
    showVisualFeedback = true,
    confirmBeforeExecute = true,
}: VoiceCommandListenerProps) {
    const [isListening, setIsListening] = useState(false);
    const [isWaitingForCommand, setIsWaitingForCommand] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [confidence, setConfidence] = useState<number>(0);
    const [isPausedForSpeech, setIsPausedForSpeech] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [networkError, setNetworkError] = useState(false);
    const wakeWordDetectedRef = useRef(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const maxRetries = 3;
    const hasNotifiedNetworkError = useRef(false);
    const lastProcessedCommand = useRef<string>('');
    const commandDebounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Request permissions on mount
    useEffect(() => {
        requestPermissions();
    }, []);

    // Setup echo cancellation - pause recognition when app speaks
    useEffect(() => {
        const handleSpeechStart = async () => {
            setIsPausedForSpeech(true);
            try {
                await ExpoSpeechRecognitionModule.stop();
                setIsListening(false);
            } catch (error) {
                console.log('Error pausing recognition:', error);
            }
        };

        const handleSpeechEnd = () => {
            setIsPausedForSpeech(false);
            // Resume listening after app finishes speaking
            if (enabled && permissionGranted) {
                setTimeout(() => {
                    startContinuousListening();
                }, 300);
            }
        };

        speechManager.onSpeechStart(handleSpeechStart);
        speechManager.onSpeechEnd(handleSpeechEnd);

        return () => {
            speechManager.removeCallback(handleSpeechStart);
            speechManager.removeCallback(handleSpeechEnd);
        };
    }, [enabled, permissionGranted]);

    // Pulsing animation for always-listening indicator
    useEffect(() => {
        if (isListening && !isPausedForSpeech && continuousMode) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isListening, isPausedForSpeech, continuousMode]);

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
        try {
            await ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: true,
                maxAlternatives: 1,
                continuous: true,
                requiresOnDeviceRecognition: false,
            });
            setIsListening(true);
            // Reset retry count and network error on successful start
            setRetryCount(0);
            if (networkError) {
                setNetworkError(false);
                hasNotifiedNetworkError.current = false;
            }
        } catch (error) {
            console.error('Start listening error:', error);
            // Trigger retry logic
            if (retryCount < maxRetries) {
                const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 8000);
                
                retryTimeoutRef.current = setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    startContinuousListening();
                }, backoffDelay);
            }
        }
    };

    // Handle speech recognition results
    useSpeechRecognitionEvent('result', async (event) => {
        const transcript = event.results[0]?.transcript?.toLowerCase() || '';
        const isFinal = event.isFinal || false;
        
        setRecognizedText(transcript);
        
        // Don't process if app is speaking (echo cancellation)
        if (isPausedForSpeech) {
            return;
        }
        
        // Continuous mode - ONLY process final results
        if (continuousMode && transcript.trim() && isFinal) {
            // Debounce: prevent duplicate processing of same command
            if (transcript === lastProcessedCommand.current) {
                return;
            }
            
            lastProcessedCommand.current = transcript;
            
            // Clear any pending debounce
            if (commandDebounceTimeout.current) {
                clearTimeout(commandDebounceTimeout.current);
            }
            
            // Reset after 2 seconds to allow same command again
            commandDebounceTimeout.current = setTimeout(() => {
                lastProcessedCommand.current = '';
            }, 2000);
            
            processCommand(transcript, 1.0);
            return;
        }
        
        // Wake word mode
        if (!continuousMode && !isWaitingForCommand && ['hey', 'okay'].some(word => transcript.includes(word))) {
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
                    try {
                        await ExpoSpeechRecognitionModule.stop();
                    } catch (error) {
                        console.log('Stop error:', error);
                    }
                    speechManager.speak('Listening cancelled', { rate: 1, language: 'en-US' });
                    if (enabled) startContinuousListening();
                }
            }, 5000);
        }
        // Process command if waiting for command (wake word mode)
        else if (!continuousMode && isWaitingForCommand && event.isFinal) {
            wakeWordDetectedRef.current = false;
            setIsWaitingForCommand(false);
            processCommand(transcript);
        }
    });

    // Handle errors with retry logic
    useSpeechRecognitionEvent('error', (event) => {
        console.error(`Speech recognition error (attempt ${retryCount + 1}/${maxRetries}):`, event.error);
        setIsListening(false);

        // Check if it's a network error
        const isNetworkError = event.error === 'network' || event.error === 'no-speech' || event.error === 'audio-capture';
        
        if (isNetworkError && retryCount >= maxRetries - 1) {
            // Network error after retries - notify user
            setNetworkError(true);
            
            if (!hasNotifiedNetworkError.current && Platform.OS !== 'web') {
                hasNotifiedNetworkError.current = true;
                try {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
                    speechManager.speak(
                        'Voice commands are not available. Please check your internet connection and try again.',
                        { rate: 1, language: 'en-US' }
                    );
                } catch (error) {
                    console.log('Could not notify user:', error);
                }
            }
            
            // Reset retry count and try again after 30 seconds
            setRetryCount(0);
            retryTimeoutRef.current = setTimeout(() => {
                if (enabled && permissionGranted) {
                    console.log('Attempting to reconnect after network error...');
                    hasNotifiedNetworkError.current = false;
                    setNetworkError(false);
                    startContinuousListening();
                }
            }, 30000);
            return;
        }

        // Retry with exponential backoff for other errors
        if (retryCount < maxRetries) {
            const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 8000); // Max 8 seconds
            console.log(`Retrying in ${backoffDelay}ms...`);
            
            retryTimeoutRef.current = setTimeout(() => {
                if (enabled && permissionGranted) {
                    setRetryCount(prev => prev + 1);
                    console.log(`Retry attempt ${retryCount + 1}/${maxRetries}`);
                    startContinuousListening();
                }
            }, backoffDelay);
        } else {
            // Max retries reached
            console.error('Max retries reached. Speech recognition failed.');
            setRetryCount(0); // Reset for next time
            
            // Try one more time after 10 seconds
            retryTimeoutRef.current = setTimeout(() => {
                if (enabled && permissionGranted) {
                    console.log('Final retry attempt after cooldown...');
                    setRetryCount(0);
                    startContinuousListening();
                }
            }, 10000);
        }
    });

    // Handle end of recognition
    useSpeechRecognitionEvent('end', () => {
        setIsListening(false);

        // Reset retry count and network error on successful end
        setRetryCount(0);
        if (networkError) {
            setNetworkError(false);
            hasNotifiedNetworkError.current = false;
            
            // Notify user that voice is back
            if (Platform.OS !== 'web') {
                try {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    speechManager.speak('Voice commands are now available.', { rate: 1, language: 'en-US' });
                } catch (error) {
                    console.log('Could not notify user:', error);
                }
            }
        }

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
                
                speechManager.speak(confirmationMessage, { 
                    rate: 1.1, 
                    language: 'en-US'
                }, () => {
                    onCommand(commandText, confidenceScore);
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
            // Clear all timeouts
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            if (commandDebounceTimeout.current) {
                clearTimeout(commandDebounceTimeout.current);
            }
            
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
            {/* Always listening button with pulse animation */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Pressable
                    onPress={handleTapToSpeak}
                    className={`w-16 h-16 rounded-full items-center justify-center shadow-lg ${
                        networkError ? 'bg-red-500' :
                        isPausedForSpeech ? 'bg-gray-500' : 
                        isWaitingForCommand ? 'bg-red-500' : 
                        isListening && continuousMode ? 'bg-green-500' : 
                        'bg-blue-500'
                    }`}
                    accessibilityLabel={networkError ? "Network error" : continuousMode ? "Always listening" : "Tap to give voice command"}
                    accessibilityHint={networkError ? "Check internet connection" : continuousMode ? "Voice commands active" : "Tap and speak your command"}
                >
                    <MaterialIcons
                        name={networkError ? 'signal-wifi-off' : isPausedForSpeech ? 'mic-off' : isWaitingForCommand ? 'mic' : 'mic'}
                        size={32}
                        color="white"
                    />
                </Pressable>
            </Animated.View>

            {/* Status indicator */}
            {continuousMode && isListening && !isPausedForSpeech && !isWaitingForCommand && !networkError && (
                <View className="mt-2 px-3 py-1 bg-green-500/80 rounded-full">
                    <Text className="text-white text-xs font-semibold">
                        Always Listening
                    </Text>
                </View>
            )}

            {networkError && (
                <View className="mt-2 px-3 py-1 bg-red-500/80 rounded-full">
                    <Text className="text-white text-xs font-semibold">
                        No Network
                    </Text>
                </View>
            )}

            {isPausedForSpeech && (
                <View className="mt-2 px-3 py-1 bg-gray-500/80 rounded-full">
                    <Text className="text-white text-xs font-semibold">
                        App Speaking...
                    </Text>
                </View>
            )}

            {!continuousMode && isListening && !isWaitingForCommand && (
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
