import React from 'react';
import { render } from '@testing-library/react-native';
import AuthScreen from '../../app/index';

describe('AuthScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders correctly', () => {
    const { getByText } = render(<AuthScreen />);
    expect(getByText('BrailleWalk')).toBeTruthy();
  });

  it('displays welcome message', () => {
    const { getByText } = render(<AuthScreen />);
    expect(getByText(/AI-powered vision assistant/i)).toBeTruthy();
  });
});
