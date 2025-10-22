import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ScanningLineProps {
  isActive: boolean;
}

export default function ScanningLine({ isActive }: ScanningLineProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Create continuous up and down animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      translateY.setValue(0);
    }
  }, [isActive, translateY]);

  if (!isActive) return null;

  const animatedStyle = {
    transform: [
      {
        translateY: translateY.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 280], // Adjust based on container height (320px - 40px for padding)
        }),
      },
    ],
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.scanLine, animatedStyle]}>
        {/* Main scanning line */}
        <View style={styles.mainLine} />
        {/* Glow effect */}
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 4,
    top: 0,
  },
  mainLine: {
    width: '100%',
    height: 4,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 10,
  },
  glowTop: {
    position: 'absolute',
    top: -20,
    width: '100%',
    height: 20,
    backgroundColor: '#3B82F6',
    opacity: 0.3,
  },
  glowBottom: {
    position: 'absolute',
    top: 4,
    width: '100%',
    height: 20,
    backgroundColor: '#3B82F6',
    opacity: 0.3,
  },
});
