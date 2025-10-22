import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, AccessibilityInfo } from 'react-native';

interface WaveformProps {
  isActive?: boolean;
  color?: string;
}

export default function Waveform({ isActive = true, color = '#FFFFFF' }: WaveformProps) {
  const animations = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.3))
  ).current;
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  useEffect(() => {
    // Listen to reduce motion preference
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
    });

    return () => {
      mounted = false;
      // removeEventListener deprecated signature; new API returns subscription with remove
      // @ts-ignore
      if (typeof sub?.remove === 'function') sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!isActive || reduceMotion) {
      animations.forEach(anim => anim.setValue(0.3));
      return;
    }

    const animateBar = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animations.forEach((anim, index) => {
      animateBar(anim, index * 100);
    });
  }, [isActive, reduceMotion]);

  return (
    <View className="flex-row items-center justify-center gap-1.5 h-10">
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          className="w-1 h-10 rounded-sm"
          style={{
            backgroundColor: color,
            transform: [{ scaleY: anim }],
          }}
        />
      ))}
    </View>
  );
}

