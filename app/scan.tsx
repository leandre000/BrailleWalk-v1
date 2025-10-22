import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

import GradientBackground from '@/components/GradientBackground';
import Waveform from '@/components/Waveform';

type ScanState = 'idle' | 'scanning' | 'analyzing' | 'result';
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
  const cameraRef = React.useRef<any>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const welcomeMessage = `Scanning mode activated. Current mode: ${scanMode}. Point camera at text or objects to analyze. Tap to scan or use mode selector to change detection type.`;
    if (Platform.OS !== 'web') {
      try {
        Speech.speak(welcomeMessage, { rate: 0.7 });
      } catch (error) {
        console.log('Speech not available:', error);
      }
    }
    
    if (permission && !permission.granted) {
      requestPermission();
    }

    scanTimeoutRef.current = setTimeout(() => {
      handleScan();
    }, 3000) as ReturnType<typeof setTimeout>;

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [permission, requestPermission, scanMode]);

  const handleScan = async () => {
    if (scanState === 'scanning' || scanState === 'analyzing') return;
    
    setScanState('scanning');
    
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        Speech.speak('Scanning in progress...', { rate: 0.7 });
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }

    setTimeout(async () => {
      setScanState('analyzing');
      if (Platform.OS !== 'web') {
        try {
          Speech.speak('Analyzing image with AI...', { rate: 0.7 });
        } catch (error) {
          console.log('Speech not available:', error);
        }
      }
      
      setTimeout(() => {
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
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            }
            
            Speech.speak(scanResult.content, { rate: 0.6 });
          } catch (error) {
            console.log('Native modules not available:', error);
          }
        }
      }, 2500);
    }, 2000);
  };

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
    
    const modeMessages = {
      auto: 'Auto mode selected. Will detect both text and objects.',
      text: 'Text mode selected. Optimized for reading signs and documents.',
      object: 'Object mode selected. Optimized for identifying objects and people.',
      barcode: 'Barcode mode selected. Optimized for scanning barcodes and QR codes.'
    };
    
    if (Platform.OS !== 'web') {
      try {
        Speech.speak(modeMessages[mode], { rate: 0.7 });
      } catch (error) {
        console.log('Speech not available:', error);
      }
    }
  };

  const handleRescan = () => {
    setScanState('idle');
    setResult('');
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        Speech.speak('Ready to scan again. Point camera at target.');
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }
  };

  const handleQuit = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        Speech.speak('Exiting scan mode');
      } catch (error) {
        console.log('Native modules not available:', error);
      }
    }
    router.back();
  };

  const handleRepeatResult = () => {
    if (result) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          Speech.speak(result, { rate: 0.6 });
        } catch (error) {
          console.log('Native modules not available:', error);
        }
      }
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
        <View className="flex-1">
          <Text className="text-xl text-white text-center mb-5">Camera permission required</Text>
          <TouchableOpacity className="bg-white py-4 px-8 rounded-3xl" onPress={requestPermission}>
            <Text className="text-lg font-bold text-blue-900">Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

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
          <Text className="text-xl text-white font-semibold mb-5 text-center">Scanning mode activated</Text>

          <View className="flex-row gap-2 mb-7.5 px-5">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-3 bg-white/10 rounded-2xl border border-white/20 ${
                scanMode === 'auto' ? 'bg-white border-white' : ''
              }`}
              onPress={() => handleModeChange('auto')}
              accessibilityLabel="Auto mode"
            >
              <MaterialIcons name="flash-auto" size={16} color={scanMode === 'auto' ? '#0047AB' : '#FFFFFF'} />
              <Text className={`text-xs font-semibold ${
                scanMode === 'auto' ? 'text-blue-900' : 'text-white'
              }`}>Auto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-3 bg-white/10 rounded-2xl border border-white/20 ${
                scanMode === 'text' ? 'bg-white border-white' : ''
              }`}
              onPress={() => handleModeChange('text')}
              accessibilityLabel="Text mode"
            >
              <MaterialIcons name="text-fields" size={16} color={scanMode === 'text' ? '#0047AB' : '#FFFFFF'} />
              <Text className={`text-xs font-semibold ${
                scanMode === 'text' ? 'text-blue-900' : 'text-white'
              }`}>Text</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-3 bg-white/10 rounded-2xl border border-white/20 ${
                scanMode === 'object' ? 'bg-white border-white' : ''
              }`}
              onPress={() => handleModeChange('object')}
              accessibilityLabel="Object mode"
            >
              <MaterialIcons name="view-in-ar" size={16} color={scanMode === 'object' ? '#0047AB' : '#FFFFFF'} />
              <Text className={`text-xs font-semibold ${
                scanMode === 'object' ? 'text-blue-900' : 'text-white'
              }`}>Object</Text>
            </TouchableOpacity>
          </View>

          <View className="w-70 h-70 rounded-2xl overflow-hidden mb-10 bg-white/10">
            {scanState === 'result' ? (
              <View className="flex-1 items-center justify-center">
                <View className="w-full h-4/5 items-center justify-center bg-white/20">
                  <Text className="text-8xl">📷</Text>
                </View>
                <Text className="text-sm text-white font-semibold mt-2.5 text-center">
                  {scanResults[0]?.type === 'text' ? '📝 Text' : 
                   scanResults[0]?.type === 'object' ? '📦 Object' : 
                   '📊 Barcode'} Detected
                </Text>
              </View>
            ) : (
              Platform.OS !== 'web' ? (
                <CameraView
                  ref={cameraRef}
                  className="flex-1"
                  facing="back"
                />
              ) : (
                <View className="flex-1 items-center justify-center bg-black/30">
                  <Text className="text-2xl text-white">📷 Camera View</Text>
                </View>
              )
            )}
          </View>

          <Text className="text-lg text-white font-semibold text-center px-8 min-h-15">
            {scanState === 'idle' && `Point camera at ${scanMode === 'text' ? 'text' : scanMode === 'object' ? 'objects' : 'text or objects'} to scan`}
            {scanState === 'scanning' && 'Scanning in progress...'}
            {scanState === 'analyzing' && 'Analyzing with AI...'}
            {scanState === 'result' && result}
          </Text>
        </View>

        <View className="items-center gap-4">
          <View className="flex-row gap-4 mb-2.5">
            {scanState === 'result' && (
              <>
                <TouchableOpacity
                  onPress={handleRepeatResult}
                  className="flex-row items-center gap-1.5 py-2.5 px-4 bg-white/10 rounded-2xl border border-white/20"
                  accessibilityLabel="Repeat result"
                  accessibilityHint="Repeat the scan result"
                >
                  <MaterialIcons name="volume-up" size={20} color="#FFFFFF" />
                  <Text className="text-sm text-white font-medium">Repeat</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleRescan}
                  className="flex-row items-center gap-1.5 py-2.5 px-4 bg-white/10 rounded-2xl border border-white/20"
                  accessibilityLabel="Scan again"
                  accessibilityHint="Start a new scan"
                >
                  <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
                  <Text className="text-sm text-white font-medium">Scan Again</Text>
                </TouchableOpacity>
              </>
            )}
            
            {scanState === 'idle' && (
              <TouchableOpacity
                onPress={handleScan}
                className="flex-row items-center gap-2 py-3 px-6 bg-green-500 rounded-3xl border border-green-600"
                accessibilityLabel="Start scan"
                accessibilityHint="Start scanning the current view"
              >
                <MaterialIcons name="camera-alt" size={24} color="#FFFFFF" />
                <Text className="text-base text-white font-semibold">Scan Now</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Waveform isActive={scanState === 'scanning' || scanState === 'analyzing'} />
          
          <TouchableOpacity
            onPress={handleQuit}
            className="py-3 px-6 bg-red-500/20 rounded-3xl border border-red-500/40"
            accessibilityLabel="Quit scanning"
            accessibilityHint="Exit scanning mode"
          >
            <Text className="text-base text-white font-semibold">Exit Scanning</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
}
