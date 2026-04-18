import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface Props {
  size: number;
  color: string;
  count?: number;
}

export const PulseRings: React.FC<Props> = ({ size, color, count = 2 }) => (
  <View style={[styles.container, { width: size, height: size }]}>
    {Array.from({ length: count }).map((_, i) => (
      <Ring key={i} size={size} color={color} delay={i * 600} />
    ))}
  </View>
);

function Ring({ size, color, delay }: { size: number; color: string; delay: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.8, duration: 2000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
