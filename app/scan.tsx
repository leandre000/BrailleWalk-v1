import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera as ExpoCamera, CameraType } from 'expo-camera';
import { Scan, Camera as CameraIcon, Volume2, RotateCcw, Zap, BookOpen, Package } from 'lucide-react-native';
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
  const [permission, requestPermission] = ExpoCamera.useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanMode, setScanMode] = useState<ScanMode>('auto');
  const [result, setResult] = useState<string>('');
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const cameraRef = React.useRef<any>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    }, 3000);

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
        <View style={styles.container}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </GradientBackground>
    );
  }

  if (!permission.granted) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>BrailleWalk</Text>
          <Text style={styles.subtitle}>Your AI-powered vision assistant.</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.modeText}>Scanning mode activated</Text>

          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, scanMode === 'auto' && styles.activeModeButton]}
              onPress={() => handleModeChange('auto')}
              accessibilityLabel="Auto mode"
            >
              <Zap size={16} color={scanMode === 'auto' ? '#0047AB' : '#FFFFFF'} />
              <Text style={[styles.modeButtonText, scanMode === 'auto' && styles.activeModeButtonText]}>Auto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modeButton, scanMode === 'text' && styles.activeModeButton]}
              onPress={() => handleModeChange('text')}
              accessibilityLabel="Text mode"
            >
              <BookOpen size={16} color={scanMode === 'text' ? '#0047AB' : '#FFFFFF'} />
              <Text style={[styles.modeButtonText, scanMode === 'text' && styles.activeModeButtonText]}>Text</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modeButton, scanMode === 'object' && styles.activeModeButton]}
              onPress={() => handleModeChange('object')}
              accessibilityLabel="Object mode"
            >
              <Package size={16} color={scanMode === 'object' ? '#0047AB' : '#FFFFFF'} />
              <Text style={[styles.modeButtonText, scanMode === 'object' && styles.activeModeButtonText]}>Object</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cameraContainer}>
            {scanState === 'result' ? (
              <View style={styles.resultContainer}>
                <View style={styles.mockImage}>
                  <Text style={styles.mockImageText}>📷</Text>
                </View>
                <Text style={styles.resultType}>
                  {scanResults[0]?.type === 'text' ? '📝 Text' : 
                   scanResults[0]?.type === 'object' ? '📦 Object' : 
                   '📊 Barcode'} Detected
                </Text>
              </View>
            ) : (
              Platform.OS !== 'web' ? (
                <ExpoCamera
                  ref={cameraRef}
                  style={styles.camera}
                  type={CameraType.back}
                />
              ) : (
                <View style={styles.mockCamera}>
                  <Text style={styles.mockCameraText}>📷 Camera View</Text>
                </View>
              )
            )}
          </View>

          <Text style={styles.instruction}>
            {scanState === 'idle' && `Point camera at ${scanMode === 'text' ? 'text' : scanMode === 'object' ? 'objects' : 'text or objects'} to scan`}
            {scanState === 'scanning' && 'Scanning in progress...'}
            {scanState === 'analyzing' && 'Analyzing with AI...'}
            {scanState === 'result' && result}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.controlButtons}>
            {scanState === 'result' && (
              <>
                <TouchableOpacity
                  onPress={handleRepeatResult}
                  style={styles.controlButton}
                  accessibilityLabel="Repeat result"
                  accessibilityHint="Repeat the scan result"
                >
                  <Volume2 size={20} color="#FFFFFF" />
                  <Text style={styles.controlButtonText}>Repeat</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleRescan}
                  style={styles.controlButton}
                  accessibilityLabel="Scan again"
                  accessibilityHint="Start a new scan"
                >
                  <RotateCcw size={20} color="#FFFFFF" />
                  <Text style={styles.controlButtonText}>Scan Again</Text>
                </TouchableOpacity>
              </>
            )}
            
            {scanState === 'idle' && (
              <TouchableOpacity
                onPress={handleScan}
                style={styles.scanButton}
                accessibilityLabel="Start scan"
                accessibilityHint="Start scanning the current view"
              >
                <CameraIcon size={24} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>Scan Now</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Waveform isActive={scanState === 'scanning' || scanState === 'analyzing'} />
          
          <TouchableOpacity
            onPress={handleQuit}
            style={styles.quitButton}
            accessibilityLabel="Quit scanning"
            accessibilityHint="Exit scanning mode"
          >
            <Text style={styles.quitText}>Exit Scanning</Text>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeModeButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  modeButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  activeModeButtonText: {
    color: '#0047AB',
  },
  cameraContainer: {
    width: 280,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  camera: {
    flex: 1,
  },
  mockCamera: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  mockCameraText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockImage: {
    width: '100%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  mockImageText: {
    fontSize: 80,
  },
  resultType: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    marginTop: 10,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    textAlign: 'center',
    paddingHorizontal: 32,
    minHeight: 60,
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
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#10B981',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#059669',
  },
  scanButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600' as const,
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
  permissionText: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  permissionButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0047AB',
  },
});