import React from 'react';
import { render } from '@testing-library/react-native';
import DashboardScreen from '../../app/dashboard';

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

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
