import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ScrollView, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { VortexLogoSimple } from '../components/VortexLogo';
import { SparkleIcon, CodeIcon, BrainIcon, FlashIcon, ChevronRightIcon } from '../components/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    id: '1',
    title: 'Selamat Datang di Vortex AI',
    description: 'Asisten AI pintar yang siap membantu Anda dalam berbagai tugas. Dari coding hingga analisis, Vortex siap membantu.',
    IconComponent: SparkleIcon,
    color: '#fe591b',
  },
  {
    id: '2',
    title: 'AI untuk Coding',
    description: 'Tulis kode lebih cepat dengan bantuan AI. Debug error, generate boilerplate, dan dapatkan code review instan.',
    IconComponent: CodeIcon,
    color: '#3B82F6',
  },
  {
    id: '3',
    title: 'Analisis Mendalam',
    description: 'Dapatkan analisis dan penalaran tingkat tinggi. Vortex Pro siap membantu pemecahan masalah kompleks.',
    IconComponent: BrainIcon,
    color: '#10B981',
  },
  {
    id: '4',
    title: 'Respons Super Cepat',
    description: 'Dengan teknologi terbaru, dapatkan jawaban dalam hitungan detik. Produktivitas Anda akan meningkat drastis.',
    IconComponent: FlashIcon,
    color: '#F59E0B',
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({ x: (currentIndex + 1) * SCREEN_WIDTH, animated: true });
    } else {
      onComplete();
    }
  };

  const skip = () => {
    onComplete();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip button */}
      <TouchableOpacity
        style={[styles.skipButton, { top: insets.top + 16 }]}
        onPress={skip}
      >
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>Lewati</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconContainer, { backgroundColor: slide.color + '15' }]}>
              <View style={[styles.iconInner, { backgroundColor: slide.color + '25' }]}>
                <slide.IconComponent size={80} color={slide.color} />
              </View>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{slide.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Pagination */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex ? colors.primary : colors.border,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Next button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={goToNext}
        >
          <Text style={styles.nextText}>
            {currentIndex === slides.length - 1 ? 'Mulai Sekarang' : 'Selanjutnya'}
          </Text>
          <ChevronRightIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: { position: 'absolute', right: 20, zIndex: 10, padding: 8 },
  skipText: { fontSize: 16, fontWeight: '500' },
  scrollView: { flex: 1 },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  iconContainer: {
    width: 180, height: 180, borderRadius: 90,
    justifyContent: 'center', alignItems: 'center', marginBottom: 40
  },
  iconInner: {
    width: 140, height: 140, borderRadius: 70,
    justifyContent: 'center', alignItems: 'center'
  },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  description: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  footer: { paddingHorizontal: 24 },
  nextButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16
  },
  nextText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginRight: 8 },
});
