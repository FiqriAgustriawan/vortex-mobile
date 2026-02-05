import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ThinkingIndicatorProps {
  visible: boolean;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ visible }) => {
  const { colors } = useTheme();
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!visible) {
      setDots('');
      return;
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 400);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.aiBubble, borderColor: colors.border }]}>
      <View style={styles.dotsContainer}>
        <View style={[styles.dot, { backgroundColor: colors.primary, opacity: dots.length >= 1 ? 1 : 0.3 }]} />
        <View style={[styles.dot, { backgroundColor: colors.primary, opacity: dots.length >= 2 ? 1 : 0.3 }]} />
        <View style={[styles.dot, { backgroundColor: colors.primary, opacity: dots.length >= 3 ? 1 : 0.3 }]} />
      </View>
      <Text style={[styles.text, { color: colors.textSecondary }]}>Vortex sedang berpikir{dots}</Text>
    </View>
  );
};

// Animated version with bouncing dots
export const ThinkingDotsAnimated: React.FC<{ visible: boolean }> = ({ visible }) => {
  const { colors } = useTheme();
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;

    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -8,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = animateDot(dot1, 0);
    const anim2 = animateDot(dot2, 150);
    const anim3 = animateDot(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={[styles.animatedContainer, { backgroundColor: colors.aiBubble, borderColor: colors.border }]}>
      <View style={styles.animatedDotsRow}>
        <Animated.View style={[styles.animatedDot, { backgroundColor: colors.primary, transform: [{ translateY: dot1 }] }]} />
        <Animated.View style={[styles.animatedDot, { backgroundColor: colors.primary, transform: [{ translateY: dot2 }] }]} />
        <Animated.View style={[styles.animatedDot, { backgroundColor: colors.primary, transform: [{ translateY: dot3 }] }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginVertical: 6,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  text: {
    fontSize: 14,
  },
  animatedContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginVertical: 6,
  },
  animatedDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
});
