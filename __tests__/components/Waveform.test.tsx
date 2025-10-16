import React from 'react';
import { render } from '@testing-library/react-native';
import Waveform from '../../components/Waveform';

describe('Waveform', () => {
  it('renders when active', () => {
    const { container } = render(<Waveform isActive={true} />);
    expect(container).toBeTruthy();
  });

  it('renders when inactive', () => {
    const { container } = render(<Waveform isActive={false} />);
    expect(container).toBeTruthy();
  });
});
