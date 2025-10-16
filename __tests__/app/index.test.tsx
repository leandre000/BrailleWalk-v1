import React from 'react';
import { render } from '@testing-library/react-native';
import AuthScreen from '../../app/index';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Medium: 'medium',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Error: 'error',
  },
}));

describe('AuthScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<AuthScreen />);
    expect(getByText('BrailleWalk')).toBeTruthy();
  });

  it('displays welcome message', () => {
    const { getByText } = render(<AuthScreen />);
    expect(getByText(/AI-powered vision assistant/i)).toBeTruthy();
  });
});
