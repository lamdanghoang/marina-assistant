import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';

interface Props {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<Props> = ({ width, height, borderRadius = 8, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius, backgroundColor: colors.surfaceContainerHigh, opacity }, style]}
    />
  );
};
