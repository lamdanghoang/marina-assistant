import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mic, Droplets, Square } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../../src/constants/theme';
import { GlassPanel } from '../../src/components/shared/GlassPanel';
import { PulseRings } from '../../src/components/shared/PulseRings';
import { Skeleton } from '../../src/components/shared/Skeleton';
import { SpriteCharacter } from '../../src/components/3d/SpriteCharacter';
import { useAppStore } from '../../src/store/appStore';
import { sendMessage, createMessage } from '../../src/services/chat';
import { speak, startListening, stopListening } from '../../src/services/voice';

const { width: SW } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const language = useAppStore((s) => s.language);
  const voiceEnabled = useAppStore((s) => s.voiceEnabled);
  const addMessage = useAppStore((s) => s.addChatMessage);
  const balance = useAppStore((s) => s.balance);
  const setBalance = useAppStore((s) => s.setBalance);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [charAnim, setCharAnim] = useState('idle');
  const [msg, setMsg] = useState('Good morning, Traveler. The Sui network is calm today. How can I assist you?');

  useEffect(() => {
    if (session?.walletAddress && !balance) {
      import('../../src/services/wallet').then(({ getBalance }) => getBalance(session.walletAddress).then(setBalance));
    }
  }, [session?.walletAddress]);

  const truncAddr = (a: string) => a ? `${a.slice(0, 4)}...${a.slice(-4)}` : '';

  const onVoiceResult = useCallback(async (text: string) => {
    setListening(false); setProcessing(true); setMsg('Processing...'); setCharAnim('thinking');
    addMessage(createMessage(text, 'user', language));
    try {
      const r = await sendMessage(text, language, session?.walletAddress);
      setMsg(r.message);
      addMessage(createMessage(r.message, 'marina', language));
      setCharAnim(r.emotion === 'happy' ? 'happy' : 'idle');
      if (voiceEnabled) { setCharAnim('talking'); await speak(r.message, language); setCharAnim('idle'); }
    } catch { setMsg('Sorry, something went wrong.'); setCharAnim('sad'); }
    finally { setProcessing(false); }
  }, [language, voiceEnabled, session?.walletAddress]);

  const toggleMic = useCallback(async () => {
    if (listening) { await stopListening(); setListening(false); return; }
    setListening(true); setMsg('Listening...'); setCharAnim('interact');
    try {
      const { ExpoSpeechRecognitionModule } = await import('expo-speech-recognition');
      ExpoSpeechRecognitionModule.removeAllListeners('result');
      ExpoSpeechRecognitionModule.removeAllListeners('error');
      ExpoSpeechRecognitionModule.removeAllListeners('end');
      ExpoSpeechRecognitionModule.addListener('result', (e: any) => {
        const t = e.results?.[0]?.transcript;
        if (t && e.isFinal) onVoiceResult(t);
        else if (t) setMsg(`🎤 "${t}"`);
      });
      ExpoSpeechRecognitionModule.addListener('error', () => { setListening(false); setMsg('Could not hear. Tap mic to retry.'); });
      ExpoSpeechRecognitionModule.addListener('end', () => setListening(false));
      await startListening(language, () => {}, () => setListening(false));
    } catch { setListening(false); setMsg('Voice not available.'); }
  }, [listening, language, onVoiceResult]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <View style={styles.avatar}><Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmFeGsPnMllH0l1nFInGBj-qHptCJ8WngJ8kUxJVNPZ7dplrE2yMjghAIMlqj568baN2o_xzAQElwMaU5TfElbWdPbY-N8dU3hZehrSWLQg7xUURdufYJtMEswe0FofA6kIYa_HoVPDlahzMzNUzjyN7YgrqnQcVs4bBhCcg80FSBwLCvRc5Lam1xoZOvnFe6qdxifymPYxBSS6jw65UIhqrOncqCbDM34aavL_nXM2g29kHjbd5_OzucX1MRYUQ9Vhqc7WwS8SJQ' }} style={{ width: '100%', height: '100%' }} /></View>
          <Text style={styles.addr}>{truncAddr(session?.walletAddress ?? '')}</Text>
        </View>
        <View style={styles.pill}><Droplets size={14} color={colors.primary} />{balance ? <Text style={styles.pillText}>{parseFloat(balance).toFixed(2)} SUI</Text> : <Skeleton width={56} height={14} borderRadius={4} />}</View>
      </View>

      <View style={styles.center}>
        <View style={styles.glow} />
        <TouchableOpacity onPress={() => setCharAnim(charAnim === 'idle' ? 'interact' : 'idle')} activeOpacity={0.9}>
          <SpriteCharacter animation={charAnim} size={SW * 0.7} fps={6} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/chat')} activeOpacity={0.8}>
          <GlassPanel style={styles.bubble}>
            <Text style={styles.bubbleLabel}>{listening ? 'YOU' : 'MARINA'}</Text>
            <Text style={styles.bubbleText} numberOfLines={4}>{msg}</Text>
            {msg.length > 120 && <Text style={styles.more}>View in Chat →</Text>}
          </GlassPanel>
        </TouchableOpacity>
      </View>

      <View style={styles.micArea}>
        <View style={styles.micWrap}>
          <PulseRings size={96} color={listening ? colors.error : colors.primary} count={2} />
          <TouchableOpacity style={styles.micBtn} onPress={toggleMic} disabled={processing} activeOpacity={0.8}>
            <View style={[styles.micInner, listening && { backgroundColor: colors.error }, processing && { backgroundColor: '#ffb400', opacity: 0.7 }]}>
              {processing ? <Text style={{ fontSize: 24 }}>⏳</Text> : listening ? <Square size={28} color={colors.surface} fill={colors.surface} /> : <Mic size={32} color={colors.surface} />}
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.micLabel}>{processing ? 'PROCESSING' : listening ? 'LISTENING' : 'AWAITING INPUT'}</Text>
        <View style={[styles.micLine, listening && { backgroundColor: colors.error }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(143,245,255,0.2)', overflow: 'hidden' },
  addr: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: 'rgba(143,245,255,0.8)' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerHighest, borderWidth: 1, borderColor: colors.glassBorder, minWidth: 100 },
  pillText: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(143,245,255,0.03)' },
  bubble: { position: 'absolute', top: '8%', right: spacing.xl, maxWidth: 200, padding: spacing.lg, borderRadius: 16, borderTopLeftRadius: 4 },
  bubbleLabel: { fontSize: typography.sizes.xs, letterSpacing: 3, color: colors.primary, fontWeight: typography.weights.bold, marginBottom: 4 },
  bubbleText: { fontSize: typography.sizes.md, lineHeight: 20, color: colors.onSurface },
  more: { color: colors.primary, fontSize: typography.sizes.xs, marginTop: spacing.sm },
  micArea: { alignItems: 'center', paddingBottom: 100, gap: spacing.md },
  micWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  micInner: { flex: 1, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center' as const, justifyContent: 'center' as const, shadowColor: colors.primaryContainer, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 40 },
  micLabel: { fontSize: typography.sizes.xs, letterSpacing: 3, color: colors.onSurfaceVariant, fontWeight: typography.weights.bold },
  micLine: { width: 48, height: 2, backgroundColor: colors.primary, borderRadius: 1, shadowColor: colors.primary, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
});
