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
      Alert.alert('Success', `Capsule created! Unlocks at ${unlockDate.toLocaleString()}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create capsule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + spacing.md }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mint New Capsule</Text>
      </View>

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
          <Text style={styles.label}>UNLOCK TEMPORAL POINT</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
            <Text style={styles.dateText}>{unlockDate.toLocaleString()}</Text>
            <Calendar size={18} color={'rgba(143,245,255,0.4)'} />
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker value={unlockDate} mode="datetime" display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={new Date()} onChange={(_, date) => { if (Platform.OS === 'android') setShowPicker(false); if (date) setUnlockDate(date); }} themeVariant="dark" />
        )}
        {Platform.OS === 'ios' && showPicker && (
          <TouchableOpacity style={styles.doneBtn} onPress={() => setShowPicker(false)}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
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
  label: { fontSize: typography.sizes.xs, letterSpacing: 3, color: 'rgba(143,245,255,0.6)', fontWeight: typography.weights.bold, marginLeft: 2 },
  input: { backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.lg, color: colors.onSurface, fontSize: typography.sizes.md },
  textarea: { height: 160, textAlignVertical: 'top' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.lg },
  dateText: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  doneBtn: { alignSelf: 'flex-end' },
  doneBtnText: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  infoCard: { flexDirection: 'row', gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.surfaceContainerLow },
  infoTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.onSurface },
  infoDesc: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, lineHeight: 16, marginTop: 4 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.xl, paddingVertical: 20, alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 4 } },
  submitText: { color: colors.surface, fontWeight: typography.weights.bold, fontSize: typography.sizes.sm, letterSpacing: 3 },
  feeText: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, textAlign: 'center' },
});
