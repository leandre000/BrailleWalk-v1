// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return {
    LinearGradient: ({ children, ...props }) => React.createElement('View', props, children)
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 })
  };
});

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const mockIcon = (name) => (props) => React.createElement('View', { ...props, testID: name });
  
  return {
    Navigation: mockIcon('Navigation'),
    Camera: mockIcon('Camera'),
    Phone: mockIcon('Phone'),
    MapPin: mockIcon('MapPin'),
    PhoneOff: mockIcon('PhoneOff'),
    MessageCircle: mockIcon('MessageCircle'),
    Clock: mockIcon('Clock'),
    AlertTriangle: mockIcon('AlertTriangle'),
    Volume2: mockIcon('Volume2'),
    RotateCcw: mockIcon('RotateCcw'),
    Scan: mockIcon('Scan'),
    Eye: mockIcon('Eye'),
    Barcode: mockIcon('Barcode'),
    Type: mockIcon('Type'),
    ArrowLeft: mockIcon('ArrowLeft'),
    ArrowRight: mockIcon('ArrowRight'),
    AlertCircle: mockIcon('AlertCircle')
  };
});

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};