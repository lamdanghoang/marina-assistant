import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../constants/theme';

interface Props {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const GlassPanel: React.FC<Props> = ({ style, children }) => (
  <View style={[styles.panel, style]}>{children}</View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
});
