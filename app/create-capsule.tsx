import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck, Lock, Calendar } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';

export default function CreateCapsuleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + spacing.md }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mint New Capsule</Text>
      </View>

      <GlassPanel style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>CAPSULE ANCHOR NAME</Text>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} placeholder="e.g. My 2030 Portfolio Strategy" placeholderTextColor={colors.onSurfaceVariant + '66'} />
            <ShieldCheck size={18} color={'rgba(143,245,255,0.4)'} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>UNLOCK TEMPORAL POINT</Text>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} placeholder="Select date and time" placeholderTextColor={colors.onSurfaceVariant + '66'} />
            <Calendar size={18} color={'rgba(143,245,255,0.4)'} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>SECRET PAYLOAD</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="The information to be encrypted until the unlock date..." placeholderTextColor={colors.onSurfaceVariant + '66'} multiline textAlignVertical="top" />
        </View>

        <GlassPanel style={styles.infoCard}>
          <Lock size={20} color={colors.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Time-Lock Mechanism</Text>
            <Text style={styles.infoDesc}>Your data is split across 20 global Walrus nodes. Decryption keys are mathematically generated only after the Sui network validates the specified epoch time.</Text>
          </View>
        </GlassPanel>

        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitText}>INITIATE TIME LOCK</Text>
        </TouchableOpacity>
        <Text style={styles.feeText}>Requires ~0.05 SUI for Gas & Walrus Storage Fee</Text>
      </GlassPanel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  form: { padding: spacing.xxl, gap: spacing.xl },
  field: { gap: spacing.sm },
  label: { fontSize: typography.sizes.xs, letterSpacing: 3, color: 'rgba(143,245,255,0.6)', fontWeight: typography.weights.bold, marginLeft: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: spacing.lg },
  input: { flex: 1, color: colors.onSurface, fontSize: typography.sizes.md, paddingVertical: spacing.lg },
  textarea: { height: 160, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.lg },
  infoCard: { flexDirection: 'row', gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.surfaceContainerLow },
  infoTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.onSurface },
  infoDesc: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, lineHeight: 16, marginTop: 4 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.xl, paddingVertical: 20, alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 4 } },
  submitText: { color: colors.surface, fontWeight: typography.weights.bold, fontSize: typography.sizes.sm, letterSpacing: 3 },
  feeText: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, textAlign: 'center' },
});
