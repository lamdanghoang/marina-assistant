import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Droplets } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../src/constants/theme';
import { GlassPanel } from '../../src/components/shared/GlassPanel';
import { PulseRings } from '../../src/components/shared/PulseRings';

const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [listening, setListening] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.avatar}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmFeGsPnMllH0l1nFInGBj-qHptCJ8WngJ8kUxJVNPZ7dplrE2yMjghAIMlqj568baN2o_xzAQElwMaU5TfElbWdPbY-N8dU3hZehrSWLQg7xUURdufYJtMEswe0FofA6kIYa_HoVPDlahzMzNUzjyN7YgrqnQcVs4bBhCcg80FSBwLCvRc5Lam1xoZOvnFe6qdxifymPYxBSS6jw65UIhqrOncqCbDM34aavL_nXM2g29kHjbd5_OzucX1MRYUQ9Vhqc7WwS8SJQ' }}
              style={styles.avatarImg}
            />
          </View>
          <Text style={styles.address}>0x7f...3b92</Text>
        </View>
        <View style={styles.balancePill}>
          <Droplets size={14} color={colors.primary} />
          <Text style={styles.balanceText}>12.5 SUI</Text>
        </View>
      </View>

      {/* Center area: character + bubble */}
      <View style={styles.centerArea}>
        {/* Glow */}
        <View style={styles.glowCircle} />

        {/* Character */}
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHFJqam6R44Lbsa1sMC7_QrhGICCY70ZIa4sM-ryQA8o-0QFIVtkmJReeFu6ComDOjSTL3P7ug3r-2GCYopbbe8HeccnCBzxbjrv2tsSMcycngZ5UELFH7oavgoSoo4fYJfNfdRoEzXQ2seJcvt32t6Esilx6LBwsd1CHH5mU41FtfmY-XmsrO8Jo8BKG85ChJjnzD4DaYi0heZIPPPIurlffk-9cocKgMgqTwVCTmimo01ouunFpRTx8RppzHJ6xcWAq2BCGBJUY' }}
          style={styles.character}
          resizeMode="contain"
        />

        {/* Speech bubble — top right */}
        <GlassPanel style={styles.speechBubble}>
          <Text style={styles.speechText}>
            Good morning, Traveler. The Sui network is calm today. How can I assist you?
          </Text>
        </GlassPanel>
      </View>

      {/* Mic area */}
      <View style={styles.micArea}>
        <View style={styles.micBtnWrapper}>
          <PulseRings size={96} color={colors.primary} count={2} />
          <TouchableOpacity
            style={styles.micBtn}
            onPress={() => setListening(!listening)}
            activeOpacity={0.8}
          >
            <View style={styles.micGradient}>
              <Mic size={32} color={colors.surface} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.micLabelArea}>
          <Text style={styles.micLabel}>AWAITING INPUT</Text>
          <View style={styles.micLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  // Top bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(143,245,255,0.2)', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  address: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: 'rgba(143,245,255,0.8)', letterSpacing: -0.5 },
  balancePill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerHighest, borderWidth: 1, borderColor: 'rgba(62,74,75,0.3)' },
  balanceIcon: { fontSize: 14 },
  balanceText: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.primary, letterSpacing: -0.5 },

  // Center
  centerArea: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  glowCircle: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(143,245,255,0.03)' },
  character: { width: SCREEN_W * 0.85, height: SCREEN_W * 0.85, marginTop: -40 },
  speechBubble: { position: 'absolute', top: '8%', right: spacing.xl, maxWidth: 200, padding: spacing.lg, borderRadius: 16, borderTopLeftRadius: 4 },
  speechText: { fontSize: typography.sizes.md, lineHeight: 20, color: colors.onSurface },

  // Mic
  micArea: { alignItems: 'center', paddingBottom: 100, justifyContent: 'center' },
  micBtnWrapper: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  micGradient: { flex: 1, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center' as const, justifyContent: 'center' as const, shadowColor: colors.primaryContainer, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 40 },
  micLabelArea: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.sm },
  micLabel: { fontSize: typography.sizes.xs, letterSpacing: 3, color: colors.onSurfaceVariant, fontWeight: typography.weights.bold },
  micLine: { width: 48, height: 2, backgroundColor: colors.primary, borderRadius: 1, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10 },
});
