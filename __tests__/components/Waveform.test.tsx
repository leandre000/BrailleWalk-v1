import React from 'react';
import { render } from '@testing-library/react-native';
import Waveform from '../../components/Waveform';

describe('Waveform', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders when active', () => {
    const { root } = render(<Waveform isActive={true} />);
    expect(root).toBeTruthy();
  });

  it('renders when inactive', () => {
    const { root } = render(<Waveform isActive={false} />);
    expect(root).toBeTruthy();
  });
});
