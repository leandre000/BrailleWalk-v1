import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBackgroundProps {
  children: React.ReactNode;
}

export default function GradientBackground({ children }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={['#0047AB', '#1E3A8A']}
      className="flex-1"
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

