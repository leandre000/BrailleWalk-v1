import React from 'react';
import { render } from '@testing-library/react-native';
import GradientBackground from '../../components/GradientBackground';
import { Text } from 'react-native';

describe('GradientBackground', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <GradientBackground>
        <Text>Test Child</Text>
      </GradientBackground>
    );
    
    expect(getByText('Test Child')).toBeTruthy();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(
      <GradientBackground>
        <Text>Content</Text>
      </GradientBackground>
    );
    
    expect(toJSON()).toBeTruthy();
  });
});
