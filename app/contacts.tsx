import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Plus, Trash2 } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';
import { getContacts, addContact, deleteContact } from '../src/services/contacts';
import type { Contact } from '../src/types';

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddr, setNewAddr] = useState('');

  const load = () => getContacts().then(setContacts);
  useEffect(() => { load(); }, []);

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async () => {
    if (!newName.trim() || !newAddr.trim()) { Alert.alert('Error', 'Enter name and address'); return; }
    await addContact(newName.trim(), newAddr.trim());
    setNewName(''); setNewAddr(''); setShowAdd(false); load();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteContact(id); load(); } },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><ArrowLeft size={20} color={colors.primary} /></TouchableOpacity>
        <Text style={styles.title}>Contacts</Text>
      </View>
      <View style={styles.searchBar}>
        <Search size={16} color={colors.onSurfaceVariant + '66'} />
        <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor={colors.onSurfaceVariant + '66'} value={search} onChangeText={setSearch} />
      </View>
      <FlatList data={filtered} keyExtractor={c => c.id} contentContainerStyle={{ gap: spacing.sm, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <GlassPanel style={styles.card}>
            <View style={styles.cardAvatar}><Text style={{ fontSize: 16, color: colors.primary, fontWeight: '700' }}>{item.name[0]}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardAddr}>{item.walletAddress.slice(0, 10)}...{item.walletAddress.slice(-4)}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
          </GlassPanel>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No contacts</Text>}
      />
      {showAdd && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setShowAdd(false)} activeOpacity={1} />
          <GlassPanel style={styles.addForm}>
            <Text style={styles.addTitle}>NEW CONTACT</Text>
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor={colors.onSurfaceVariant + '66'} value={newName} onChangeText={setNewName} />
            <TextInput style={styles.input} placeholder="Address (0x...)" placeholderTextColor={colors.onSurfaceVariant + '66'} value={newAddr} onChangeText={setNewAddr} autoCapitalize="none" />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity style={[styles.formBtn, { flex: 1 }]} onPress={() => setShowAdd(false)}><Text style={styles.formBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.formBtn, styles.formBtnPrimary, { flex: 1 }]} onPress={handleAdd}><Text style={[styles.formBtnText, { color: colors.surface }]}>Save</Text></TouchableOpacity>
            </View>
          </GlassPanel>
        </View>
      )}
      {!showAdd && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}><Plus size={24} color={colors.surface} /></TouchableOpacity>
      )}
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
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  cardAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.onSurface },
  cardAddr: { fontSize: typography.sizes.xs, color: 'rgba(143,245,255,0.6)', fontFamily: 'monospace', marginTop: 2 },
  empty: { textAlign: 'center', color: colors.onSurfaceVariant, marginTop: 40 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: spacing.xl, zIndex: 10 },
  overlayBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  addForm: { padding: spacing.xl, gap: spacing.md },
  addTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.primary, letterSpacing: 3, textAlign: 'center', marginBottom: spacing.sm },
  input: { backgroundColor: colors.surfaceContainer, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.lg, color: colors.onSurface },
  formBtn: { paddingVertical: 14, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  formBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  formBtnText: { fontWeight: typography.weights.bold, color: colors.onSurface, letterSpacing: 2, fontSize: typography.sizes.sm },
  fab: { position: 'absolute', bottom: 100, right: spacing.xl, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryContainer, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
});
