import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Upload, FileText, Image, Film, Music, File, Trash2, ExternalLink } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../src/constants/theme';
import { GlassPanel } from '../src/components/shared/GlassPanel';
import { Skeleton } from '../src/components/shared/Skeleton';
import { getFiles, uploadFile, deleteFile, StoredFile } from '../src/services/files';

const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return <Image size={20} color={colors.primary} />;
  if (mime.startsWith('video/')) return <Film size={20} color={colors.secondary} />;
  if (mime.startsWith('audio/')) return <Music size={20} color={'#a882ff'} />;
  if (mime.includes('pdf') || mime.includes('text')) return <FileText size={20} color={colors.primary} />;
  return <File size={20} color={colors.onSurfaceVariant} />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function FilesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(useCallback(() => {
    getFiles().then(f => { setFiles(f); setLoading(false); });
  }, []));

  const handleUpload = async () => {
    try {
      const { getDocumentAsync } = await import('expo-document-picker');
      const result = await getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploading(true);
      const file = await uploadFile(asset.uri, asset.name, asset.size ?? 0, asset.mimeType ?? 'application/octet-stream');
      setFiles(prev => [file, ...prev]);
      Alert.alert('Uploaded', `${asset.name} stored on Walrus.`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (file: StoredFile) => {
    Alert.alert('Delete', `Remove "${file.name}" from your list? (Walrus blob remains until expiry)`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteFile(file.id);
        setFiles(prev => prev.filter(f => f.id !== file.id));
      }},
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Files</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={uploading}>
          <Upload size={18} color={colors.surface} />
          <Text style={styles.uploadText}>{uploading ? 'Uploading...' : 'Upload'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ gap: spacing.md }}>{[1,2,3].map(i => <Skeleton key={i} width="100%" height={64} borderRadius={16} />)}</View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={f => f.id}
          contentContainerStyle={{ paddingBottom: 100, gap: spacing.sm }}
          renderItem={({ item }) => (
            <GlassPanel style={styles.fileCard}>
              <View style={styles.fileIcon}>{fileIcon(item.mimeType)}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.fileMeta}>{formatSize(item.size)} • {new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity onPress={() => Linking.openURL(`${WALRUS_AGGREGATOR}/v1/blobs/${item.blobId}`)} style={styles.iconBtn}>
                <ExternalLink size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                <Trash2 size={16} color={colors.error} />
              </TouchableOpacity>
            </GlassPanel>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Upload size={48} color={colors.onSurfaceVariant + '40'} />
              <Text style={styles.emptyText}>No files yet</Text>
              <Text style={styles.emptyHint}>Upload files to store them on Walrus</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.onSurface },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  uploadText: { color: colors.surface, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, letterSpacing: 1 },
  fileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  fileIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.onSurface },
  fileMeta: { fontSize: typography.sizes.xs, color: colors.onSurfaceVariant, marginTop: 2 },
  iconBtn: { padding: spacing.sm },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { fontSize: typography.sizes.md, color: colors.onSurfaceVariant, letterSpacing: 2 },
  emptyHint: { fontSize: typography.sizes.sm, color: colors.onSurfaceVariant + '80' },
});
