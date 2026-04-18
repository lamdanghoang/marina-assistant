import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Send, Plus } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';
import { CONTACTS } from '../src/constants/data';

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const filtered = CONTACTS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Contacts</Text>
      </View>

      <View style={styles.searchBar}>
        <Search size={16} color={colors.onSurfaceVariant + '66'} />
        <TextInput style={styles.searchInput} placeholder="Search addresses or names..." placeholderTextColor={colors.onSurfaceVariant + '66'} value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={c => c.id}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <GlassPanel style={styles.contactCard}>
            <View style={styles.contactAvatar}><Text style={styles.contactInitial}>{item.name[0]}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactAddr}>{item.address}</Text>
            </View>
            <TouchableOpacity style={styles.sendBtn}><Send size={16} color={colors.primary} /></TouchableOpacity>
          </GlassPanel>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No contacts found</Text>}
      />

      <TouchableOpacity style={styles.addBtn}>
        <Plus size={18} color={colors.primary} />
        <Text style={styles.addText}>ESTABLISH NEW SECURE LINK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.xl, paddingHorizontal: spacing.lg, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.glassBorder },
  searchInput: { flex: 1, color: colors.onSurface, fontSize: typography.sizes.md, paddingVertical: spacing.lg },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  contactAvatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  contactInitial: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary },
  contactName: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.onSurface },
  contactAddr: { fontSize: typography.sizes.xs, color: 'rgba(143,245,255,0.6)', fontFamily: 'monospace', marginTop: 2 },
  sendBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(143,245,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: colors.onSurfaceVariant, marginTop: 40, fontSize: typography.sizes.sm },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xl, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(143,245,255,0.3)', backgroundColor: 'rgba(143,245,255,0.05)', marginTop: spacing.xl },
  addText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.primary, letterSpacing: 3 },
});
