import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, ShieldCheck, Lock, Calendar } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';
import { useAppStore } from '../src/store/appStore';
import { createCapsule } from '../src/services/capsule';
import { findByName } from '../src/services/contacts';

const formatDate = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function CreateCapsuleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const [content, setContent] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [selfCapsule, setSelfCapsule] = useState(true);
  const [unlockDate, setUnlockDate] = useState(new Date(Date.now() + 7 * 86400000));
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!content.trim()) { Alert.alert('Error', 'Enter capsule content'); return; }
    if (unlockDate.getTime() < Date.now()) { Alert.alert('Error', 'Unlock time must be in the future'); return; }

    let recipientAddress = session?.walletAddress ?? '';
    let name = 'Self';

    if (!selfCapsule) {
      if (!recipientName.trim()) { Alert.alert('Error', 'Enter recipient name or address'); return; }
      if (recipientName.startsWith('0x')) {
        recipientAddress = recipientName.trim();
        name = recipientAddress.slice(0, 8) + '...';
      } else {
        const contact = await findByName(recipientName);
        if (!contact) { Alert.alert('Error', `"${recipientName}" not found in contacts`); return; }
        recipientAddress = contact.walletAddress;
        name = contact.name;
      }
    }

    setLoading(true);
    try {
      await createCapsule({
        content: content.trim(),
        senderAddress: session?.walletAddress ?? '',
        recipientAddress,
        recipientName: name,
        unlockAt: unlockDate,
      });
      Alert.alert('Success', `Capsule created! Unlocks at ${formatDate(unlockDate)}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create capsule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[{ flex: 1, backgroundColor: colors.surface }, { paddingTop: insets.top + spacing.md }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mint New Capsule</Text>
      </View>

    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      <GlassPanel style={styles.form}>
        {/* Recipient toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggle, selfCapsule && styles.toggleActive]} onPress={() => setSelfCapsule(true)}>
            <Text style={[styles.toggleText, selfCapsule && styles.toggleTextActive]}>For Myself</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggle, !selfCapsule && styles.toggleActive]} onPress={() => setSelfCapsule(false)}>
            <Text style={[styles.toggleText, !selfCapsule && styles.toggleTextActive]}>For Someone</Text>
          </TouchableOpacity>
        </View>

        {/* Recipient input */}
        {!selfCapsule && (
          <View style={styles.field}>
            <Text style={styles.label}>RECIPIENT</Text>
            <TextInput style={styles.input} placeholder="Contact name or 0x address" placeholderTextColor={colors.onSurfaceVariant + '66'} value={recipientName} onChangeText={setRecipientName} autoCapitalize="none" />
          </View>
        )}

        {/* Unlock time */}
        <View style={styles.field}>
          <Text style={styles.label}>UNLOCK DATE</Text>
          <View style={styles.presets}>
            {[
              { label: '1h', ms: 3600000 },
              { label: '1d', ms: 86400000 },
              { label: '7d', ms: 604800000 },
              { label: '30d', ms: 2592000000 },
              { label: '1y', ms: 31536000000 },
            ].map(p => (
              <TouchableOpacity key={p.label} style={styles.presetBtn} onPress={() => setUnlockDate(new Date(Date.now() + p.ms))}>
                <Text style={styles.presetText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
            <Text style={styles.dateText}>{formatDate(unlockDate)}</Text>
            <Calendar size={18} color={'rgba(143,245,255,0.4)'} />
          </TouchableOpacity>
        </View>

        {showPicker && (
          <View style={styles.pickerOverlay}>
            <TouchableOpacity style={styles.pickerBg} onPress={() => setShowPicker(false)} activeOpacity={1} />
            <View style={styles.pickerCard}>
              <DateTimePicker value={unlockDate} mode="datetime" display="spinner" minimumDate={new Date()} onChange={(_, date) => { if (date) setUnlockDate(date); }} themeVariant="dark" />
              <TouchableOpacity style={styles.pickerDone} onPress={() => setShowPicker(false)}>
                <Text style={styles.pickerDoneText}>CONFIRM</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content */}
        <View style={styles.field}>
          <Text style={styles.label}>SECRET PAYLOAD</Text>
          <TextInput style={[styles.input, styles.textarea]} placeholder="The information to be encrypted until the unlock date..." placeholderTextColor={colors.onSurfaceVariant + '66'} value={content} onChangeText={setContent} multiline textAlignVertical="top" />
        </View>

        {/* Info card */}
        <GlassPanel style={styles.infoCard}>
          <Lock size={20} color={colors.secondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Time-Lock Mechanism</Text>
            <Text style={styles.infoDesc}>Your data is encrypted with Seal and stored on Walrus. Only the designated recipient can decrypt after the unlock time.</Text>
          </View>
        </GlassPanel>

        {/* Submit */}
        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.5 }]} onPress={handleCreate} disabled={loading}>
          <Text style={styles.submitText}>{loading ? 'ENCRYPTING...' : 'INITIATE TIME LOCK'}</Text>
        </TouchableOpacity>
        <Text style={styles.feeText}>Requires ~0.05 SUI for Gas & Walrus Storage Fee</Text>
      </GlassPanel>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  form: { padding: spacing.xxl, gap: spacing.xl },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  toggle: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  toggleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { color: colors.onSurfaceVariant, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  toggleTextActive: { color: colors.surface },
  field: { gap: spacing.sm },
  presets: { flexDirection: 'row', gap: spacing.sm },
  presetBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  presetText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.primary, letterSpacing: 1 },
  label: { fontSize: typography.sizes.xs, letterSpacing: 3, color: 'rgba(143,245,255,0.6)', fontWeight: typography.weights.bold, marginLeft: 2 },
  input: { backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.lg, color: colors.onSurface, fontSize: typography.sizes.md },
  textarea: { height: 160, textAlignVertical: 'top' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.lg },
  dateText: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', zIndex: 10 },
  pickerBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  pickerCard: { marginHorizontal: spacing.xl, backgroundColor: colors.surfaceContainerHigh, borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder },
  pickerDone: { paddingVertical: 16, alignItems: 'center', backgroundColor: colors.primary },
  pickerDoneText: { color: colors.surface, fontWeight: typography.weights.bold, letterSpacing: 3, fontSize: typography.sizes.sm },
  infoCard: { flexDirection: 'row', gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.surfaceContainerLow },
  infoTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.onSurface },
  infoDesc: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, lineHeight: 16, marginTop: 4 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.xl, paddingVertical: 20, alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 4 } },
  submitText: { color: colors.surface, fontWeight: typography.weights.bold, fontSize: typography.sizes.sm, letterSpacing: 3 },
  feeText: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, textAlign: 'center' },
});
