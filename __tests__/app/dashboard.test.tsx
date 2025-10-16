import React from 'react';
import { render } from '@testing-library/react-native';
import DashboardScreen from '../../app/dashboard';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
}));

describe('DashboardScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText('BrailleWalk')).toBeTruthy();
  });

  it('displays all three feature cards', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText('Navigate')).toBeTruthy();
    expect(getByText('Scan Object')).toBeTruthy();
    expect(getByText('I need help')).toBeTruthy();
  });
});
