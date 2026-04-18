import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

// Sprite sheets: 4 columns x 2 rows = 8 frames per sheet
const COLS = 4;
const ROWS = 2;
const TOTAL_FRAMES = COLS * ROWS;

// Animation sets — each action has multiple sprite sheets, picked randomly
const ANIMATIONS: Record<string, any[]> = {
  idle: [
    require('../../../assets/animations/idle/idle-0.png'),
    require('../../../assets/animations/idle/idle-1.png'),
  ],
  ok: [
    require('../../../assets/animations/ok/ok-0.png'),
    require('../../../assets/animations/ok/ok-1.png'),
  ],
  shy: [
    require('../../../assets/animations/shy/shy-0.png'),
    require('../../../assets/animations/shy/shy-1.png'),
  ],
  talk: [
    require('../../../assets/animations/talk/talk-0.png'),
    require('../../../assets/animations/talk/talk-1.png'),
    require('../../../assets/animations/talk/talk-2.png'),
    require('../../../assets/animations/talk/talk-3.png'),
  ],
  think: [
    require('../../../assets/animations/think/think-0.png'),
    require('../../../assets/animations/think/think-1.png'),
    require('../../../assets/animations/think/think-2.png'),
  ],
  waving: [
    require('../../../assets/animations/waving/waving-0.png'),
    require('../../../assets/animations/waving/waving-1.png'),
  ],
};

// Map CharacterAnimation to animation set
const ANIM_MAP: Record<string, string> = {
  idle: 'idle',
  talking: 'talk',
  thinking: 'think',
  happy: 'ok',
  sad: 'shy',
  interact: 'waving',
};

interface Props {
  animation: string;
  size?: number;
  fps?: number;
}

export const SpriteCharacter: React.FC<Props> = ({ animation, size = 300, fps = 8 }) => {
  const [frame, setFrame] = useState(0);
  const [sheet, setSheet] = useState<any>(null);
  const prevAnim = useRef(animation);

  // Pick random sheet when animation changes
  useEffect(() => {
    const key = ANIM_MAP[animation] || 'idle';
    const sheets = ANIMATIONS[key] || ANIMATIONS.idle;
    const randomSheet = sheets[Math.floor(Math.random() * sheets.length)];
    setSheet(randomSheet);
    setFrame(0);
    prevAnim.current = animation;
  }, [animation]);

  // Animate frames
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % TOTAL_FRAMES);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [fps, sheet]);

  if (!sheet) return null;

  const frameW = size;
  const frameH = size;
  const col = frame % COLS;
  const row = Math.floor(frame / COLS);

  return (
    <View style={[styles.container, { width: frameW, height: frameH, overflow: 'hidden' }]}>
      <Image
        source={sheet}
        style={{
          width: frameW * COLS,
          height: frameH * ROWS,
          position: 'absolute',
          left: -col * frameW,
          top: -row * frameH,
        }}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
