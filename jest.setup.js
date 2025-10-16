// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeModule: jest.fn(),
  NativeModulesProxy: {},
  EventEmitter: jest.fn(),
  Subscription: jest.fn(),
  UnavailabilityError: class UnavailabilityError extends Error {}
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient'
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 })
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Navigation: 'Navigation',
  Camera: 'Camera',
  Phone: 'Phone',
  MapPin: 'MapPin',
  PhoneOff: 'PhoneOff',
  MessageCircle: 'MessageCircle',
  Clock: 'Clock',
  AlertTriangle: 'AlertTriangle',
  Volume2: 'Volume2',
  RotateCcw: 'RotateCcw',
  Scan: 'Scan',
  Eye: 'Eye',
  Barcode: 'Barcode',
  Type: 'Type',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  AlertCircle: 'AlertCircle'
}));

// Mock Animated
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');