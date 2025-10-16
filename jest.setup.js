// Mock all Expo modules
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return {
    LinearGradient: ({ children, ...props }) => React.createElement('View', props, children)
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  Stack: { Screen: 'Screen' }
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn()
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy'
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error'
  }
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: 0, longitude: 0 }
  })),
  Accuracy: { High: 4 }
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 })
  };
});

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

global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};