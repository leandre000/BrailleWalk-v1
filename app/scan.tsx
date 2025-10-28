import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import GradientBackground from '@/components/GradientBackground';
import Waveform from '@/components/Waveform';
import VoiceCommandListener from '@/components/VoiceCommandListener';
import ScanningLine from '@/components/ScanningLine';
import ScannerFrame from '@/components/ScannerFrame';
import { matchCommand, getSuggestions, SCAN_COMMANDS } from '@/utils/commandMatcher';
import { speechManager } from '@/utils/speechManager';

type ScanState = 'idle' | 'scanning' | 'analyzing' | 'result' | 'exit';
type ScanMode = 'auto' | 'text' | 'object' | 'barcode';

interface ScanResult {
  type: 'text' | 'object' | 'barcode';
  content: string;
  confidence: number;
  timestamp: number;
}

interface DetectedObject {
  name: string;
  confidence: number;
  description: string;
  category: string;
}

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanMode, setScanMode] = useState<ScanMode>('auto');
  const [result, setResult] = useState<string>('');
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [autoScan, setAutoScan] = useState<boolean>(true);
  const cameraRef = React.useRef<any>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoScanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExitingRef = useRef(false);

  const mockTextResults = [
    'Stop sign ahead. Please be careful.',
    'Welcome to BrailleWalk. Your AI-powered vision assistant.',
    'Exit 2B - Downtown District',
    'Menu: Coffee $3.50, Tea $2.50, Pastry $4.00',
    'Room 204 - Conference Room',
    'Bus Stop - Route 15 - Next bus in 8 minutes',
  ];

  const mockObjectResults: DetectedObject[] = [
    { name: 'Person', confidence: 0.95, description: 'A person standing 3 meters away', category: 'human' },
    { name: 'Car', confidence: 0.89, description: 'A red sedan parked on the street', category: 'vehicle' },
    { name: 'Stairs', confidence: 0.92, description: 'A flight of stairs going up, use handrail for safety', category: 'structure' },
    { name: 'Door', confidence: 0.87, description: 'A wooden door with a handle on the right side', category: 'structure' },
    { name: 'Book', confidence: 0.91, description: 'A book titled "The Great Gatsby" by F. Scott Fitzgerald', category: 'object' },
    { name: 'Bottle', confidence: 0.88, description: 'A water bottle, half full', category: 'object' },
  ];

  useEffect(() => {
    // Request camera permission on mount
    const initCamera = async () => {
      if (!permission) {
        return;
      }

      if (!permission.granted) {
        const result = await requestPermission();
        console.log('Camera permission result:', result);
      }
    };

    initCamera();

    // Reduced speech - only announce mode
    if (Platform.OS !== 'web') {
      try {
        speechManager.speak(`${scanMode} mode`, { rate: 1 });
      } catch (error) {
        console.log('Speech not available:', error);
      }
    }

    return () => {
      // Clear all timers to prevent memory leaks
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = null;
      }
      if (autoScanTimeoutRef.current) {
        clearTimeout(autoScanTimeoutRef.current);
        autoScanTimeoutRef.current = null;
      }
      // Reset states when leaving screen
      setScanState('idle');
      setResult('');
      setCapturedImage(null);
      setAutoScan(true);
      // Stop speech
      speechManager.stop();
    };
  }, [scanMode]);

  const handleScan = async () => {
    if (scanState === 'scanning' || scanState === 'analyzing') return;

    setScanState('scanning');

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
        speechManager.speak('Scanning', { rate: 1 });
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }

    // Capture photo from camera
    if (cameraRef.current && Platform.OS !== 'web') {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        console.log('Camera capture error:', error);
      }
    }

    setTimeout(async () => {
      setScanState('analyzing');

      setTimeout(() => {
        console.log(scanState)
        if (scanState === 'exit' || isExitingRef.current) return;
        const scanResult = performAIAnalysis();
        setResult(scanResult.content);
        setScanState('result');

        const newResult: ScanResult = {
          type: scanResult.type,
          content: scanResult.content,
          confidence: scanResult.confidence,
          timestamp: Date.now()
        };
        setScanResults(prev => [newResult, ...prev.slice(0, 4)]);

        if (Platform.OS !== 'web') {
          try {
            if (scanResult.confidence > 0.8) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
            }

            // Reduced speech - just the result, wait for it to finish
            speechManager.speak(scanResult.content, {
              rate: 1
            }, () => {
              console.log('Speech finished, resetting to idle in 1s');
              // Wait 1 second after speech finishes before resetting
              setTimeout(() => {
                if (autoScan) {
                  // In auto mode, reset to idle (which will trigger auto-scan again)
                  setScanState('idle');
                } else {
                  // In manual mode, stay on result screen
                  console.log('Manual mode - staying on result screen');
                }
              }, 1000);
            });
          } catch (error) {
            console.log('Native modules not available:', error);
            // If speech module not available, reset after 2 seconds
            resultTimeoutRef.current = setTimeout(() => {
              console.log('Resetting to idle from result (no speech)');
              setScanState('idle');
              setResult('');
              setCapturedImage(null);
            }, 2000) as ReturnType<typeof setTimeout>;
          }
        } else {
          // Web platform - no speech, reset after 2 seconds
          resultTimeoutRef.current = setTimeout(() => {
            console.log('Resetting to idle from result (web)');
            setScanState('idle');
            setResult('');
            setCapturedImage(null);
          }, 2000) as ReturnType<typeof setTimeout>;
        }
      }, 2000);
    }, 1500);
  };

  // Continuous scanning - automatically starts when idle
  useEffect(() => {
    console.log('State:', scanState, 'Permission:', permission?.granted);
    if (scanState === 'exit') {
      return
    }
    if (scanState === 'idle' && permission?.granted) {
      console.log('Starting scan in 2 seconds...');
      scanTimeoutRef.current = setTimeout(() => {
        console.log('Triggering handleScan');
        handleScan();
      }, 2000) as ReturnType<typeof setTimeout>;
    }

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [scanState, permission]);

  const performAIAnalysis = () => {
    switch (scanMode) {
      case 'text':
        const textResult = mockTextResults[Math.floor(Math.random() * mockTextResults.length)];
        return {
          type: 'text' as const,
          content: `Text detected: ${textResult}`,
          confidence: 0.85 + Math.random() * 0.15
        };
      case 'object':
        const objectResult = mockObjectResults[Math.floor(Math.random() * mockObjectResults.length)];
        return {
          type: 'object' as const,
          content: `Object detected: ${objectResult.description}`,
          confidence: objectResult.confidence
        };
      case 'barcode':
        return {
          type: 'barcode' as const,
          content: 'Barcode detected: Product ID 12345 - Apple iPhone 15 Pro',
          confidence: 0.92
        };
      default:
        const isText = Math.random() > 0.5;
        if (isText) {
          const textResult = mockTextResults[Math.floor(Math.random() * mockTextResults.length)];
          return {
            type: 'text' as const,
            content: `Text detected: ${textResult}`,
            confidence: 0.85 + Math.random() * 0.15
          };
        } else {
          const objectResult = mockObjectResults[Math.floor(Math.random() * mockObjectResults.length)];
          return {
            type: 'object' as const,
            content: `Object detected: ${objectResult.description}`,
            confidence: objectResult.confidence
          };
        }
    }
  };

  const handleModeChange = (mode: ScanMode) => {
    setScanMode(mode);

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }

    // Reduced speech - just mode name
    if (Platform.OS !== 'web') {
      try {
        speechManager.speak(`Switched to ${mode} mode`, { rate: 1 });
      } catch (error) {
        console.log('Speech not available:', error);
      }
    }
  };


  const handleQuit = () => {
    // Clear all timers
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = null;
    }
    if (autoScanTimeoutRef.current) {
      clearTimeout(autoScanTimeoutRef.current);
      autoScanTimeoutRef.current = null;
    }
    speechManager.stop();
    [scanTimeoutRef, resultTimeoutRef, autoScanTimeoutRef].forEach(ref => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    });
    isExitingRef.current = true;
    setScanState('exit');
    setResult('');
    setCapturedImage(null);
    setAutoScan(true);
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
        speechManager.speak('Exiting', { rate: 1 });
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }
    router.back();
  };

  const handleVoiceCommand = (command: string, confidence?: number) => {
    // Use fuzzy matching to find the best command match
    const match = matchCommand(command, SCAN_COMMANDS, 0.6);

    if (match) {
      console.log(`Matched: ${match.command} (confidence: ${match.confidence}, heard: "${match.matchedPhrase}")`);

      // Handle matched command
      if (match.command === 'scan') {
        handleScan();
      }
      else if (match.command === 'text') {
        handleModeChange('text');
      }
      else if (match.command === 'object') {
        handleModeChange('object');
      }
      else if (match.command === 'barcode') {
        handleModeChange('barcode');
      }
      else if (match.command === 'auto') {
        handleModeChange('auto');
      }
      else if (match.command === 'manual') {
        // Toggle off auto mode
        if (autoScan) {
          setAutoScan(false);
          speechManager.speak('Manual mode', { rate: 1, language: 'en-US' });
        }
      }
      else if (match.command === 'exit') {
        handleQuit();
      }
    } else {
      // Command not recognized - provide helpful suggestions
      const suggestions = getSuggestions(command, SCAN_COMMANDS, 3);

      let errorMessage = "I didn't understand that. ";
      if (suggestions.length > 0) {
        errorMessage += `Did you mean: ${suggestions.slice(0, 2).join(', or ')}?`;
      } else {
        errorMessage += "Try saying: scan, text mode, object mode, or exit.";
      }

      if (Platform.OS !== 'web') {
        speechManager.speak(errorMessage, { rate: 1, language: 'en-US' });
      }

      console.log(`Command not recognized: "${command}". Suggestions: ${suggestions.join(', ')}`);
    }
  };


  if (!permission) {
    return (
      <GradientBackground>
        <View className="flex-1">
          <Text className="text-xl text-white text-center mb-5">Requesting camera permission...</Text>
        </View>
      </GradientBackground>
    );
  }

  if (!permission.granted) {
    return (
      <GradientBackground>
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
        >
          <View className="items-center ">
            <MaterialIcons name="camera-alt" size={100} color="#FFFFFF" style={{ opacity: 0.8 }} />
            <Text className="text-2xl font-bold text-white text-center mt-8 mb-4">Camera Access Required</Text>
            <Text className="text-base text-white text-center opacity-80 mb-8">
              BrailleWalk needs camera access to scan text and identify objects for you.
            </Text>
          </View>
          <TouchableOpacity
            className="bg-white py-4 px-8 rounded-full"
            onPress={requestPermission}
            accessibilityLabel="Grant camera permission"
          >
            <Text className="text-lg font-bold text-blue-900">Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View
        className="flex-1 gap-y-4"
        style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
      >
        <View className="items-center gap-y-2">
          <Text className="text-5xl font-bold text-white ">BrailleWalk</Text>
          <Text className="text-base text-white opacity-80">Your AI-powered vision assistant.</Text>
        </View>

        <View className="items-center justify-center px-6 gap-y-2">
          <Text className="text-lg text-white font-medium text-center opacity-90">Scanning mode activated</Text>

          <View className="flex-row gap-3  px-4">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-2 py-3 px-4 rounded-full border-2 ${scanMode === 'auto' ? 'bg-white border-white' : 'bg-white/10 border-white/30'
                }`}
              onPress={() => handleModeChange('auto')}
              accessibilityLabel="Auto mode"
            >
              <MaterialIcons name="flash-auto" size={18} color={scanMode === 'auto' ? '#0047AB' : '#FFFFFF'} />
              <Text className={`text-sm font-semibold ${scanMode === 'auto' ? 'text-blue-900' : 'text-white'
                }`}>Auto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-2 py-3 px-4 rounded-full border-2 ${scanMode === 'text' ? 'bg-white border-white' : 'bg-white/10 border-white/30'
                }`}
              onPress={() => handleModeChange('text')}
              accessibilityLabel="Text mode"
            >
              <MaterialIcons name="text-fields" size={18} color={scanMode === 'text' ? '#0047AB' : '#FFFFFF'} />
              <Text className={`text-sm font-semibold ${scanMode === 'text' ? 'text-blue-900' : 'text-white'
                }`}>Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-2 py-3 px-4 rounded-full border-2 ${scanMode === 'object' ? 'bg-white border-white' : 'bg-white/10 border-white/30'
                }`}
              onPress={() => handleModeChange('object')}
              accessibilityLabel="Object mode"
            >
              <MaterialIcons name="view-in-ar" size={18} color={scanMode === 'object' ? '#0047AB' : '#FFFFFF'} />
              <Text className={`text-sm font-semibold ${scanMode === 'object' ? 'text-blue-900' : 'text-white'
                }`}>Object</Text>
            </TouchableOpacity>
          </View>

          <View className="w-80 h-80 rounded-3xl overflow-hidden  bg-white/10 border-4 border-white/20">
            {scanState === 'result' ? (
              <View className="flex-1 items-center justify-center bg-black">
                {capturedImage ? (
                  <Image
                    source={{ uri: capturedImage }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-white">
                    <MaterialIcons
                      name={scanResults[0]?.type === 'text' ? 'text-fields' : 'view-in-ar'}
                      size={100}
                      color="#0047AB"
                    />
                  </View>
                )}
              </View>
            ) : (
              <View className="flex-1 relative">
                {Platform.OS !== 'web' && permission?.granted ? (
                  <>
                    <CameraView
                      ref={cameraRef}
                      style={{ flex: 1, width: '100%', height: '100%' }}
                      facing="back"
                      mode="picture"
                    />
                    {/* Always show scanner frame */}
                    <ScannerFrame />
                    {/* Show scanning line when scanning or analyzing */}
                    <ScanningLine isActive={scanState === 'scanning' || scanState === 'analyzing'} />
                  </>
                ) : Platform.OS !== 'web' ? (
                  <View className="flex-1 items-center justify-center bg-black">
                    <MaterialIcons name="no-photography" size={80} color="#FFFFFF" style={{ opacity: 0.5 }} />
                    <Text className="text-white text-center mt-4">Camera permission needed</Text>
                  </View>
                ) : (
                  <>
                    <View className="flex-1 items-center justify-center bg-black/30">
                      <MaterialIcons name="camera-alt" size={80} color="#FFFFFF" style={{ opacity: 0.5 }} />
                    </View>
                    {/* Always show scanner frame */}
                    <ScannerFrame />
                    {/* Show scanning line when scanning or analyzing */}
                    <ScanningLine isActive={scanState === 'scanning' || scanState === 'analyzing'} />
                  </>
                )}
              </View>
            )}
          </View>

          <Text className="text-base text-white font-medium text-center px-8 min-h-12 opacity-90">
            {scanState === 'idle' && `Point camera at ${scanMode === 'text' ? 'text' : scanMode === 'object' ? 'objects' : 'text or objects'} to scan`}
            {scanState === 'scanning' && 'Scanning in progress...'}
            {scanState === 'analyzing' && 'Analyzing with AI...'}
            {scanState === 'result' && result}
          </Text>
        </View>

        <View className="items-center gap-4">

          <Waveform isActive={scanState === 'scanning' || scanState === 'analyzing'} />

          <TouchableOpacity
            onPress={handleQuit}
            className="py-3 px-8 bg-red-500/20 rounded-full border border-red-500/40"
            accessibilityLabel="Quit scanning"
            accessibilityHint="Exit scanning mode"
          >
            <Text className="text-base text-white font-semibold">Exit Scanning</Text>
          </TouchableOpacity>
        </View>

        {/* Voice Command Listener */}
        <VoiceCommandListener
          onCommand={handleVoiceCommand}
          enabled={true}
          continuousMode={true}
          showVisualFeedback={true}
        />
      </View>
    </GradientBackground>
  );
}
