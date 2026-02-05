import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G, Circle } from 'react-native-svg';

interface VortexLogoProps {
  size?: number;
  color?: string;
  showGradient?: boolean;
}

// Main "V" Logo with modern design
export const VortexLogoSvg: React.FC<VortexLogoProps> = ({
  size = 40,
  color = '#fe591b',
  showGradient = true
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="vGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ff7a45" />
          <Stop offset="50%" stopColor="#fe591b" />
          <Stop offset="100%" stopColor="#e64a00" />
        </LinearGradient>
        <LinearGradient id="vGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ffb347" />
          <Stop offset="100%" stopColor="#fe591b" />
        </LinearGradient>
      </Defs>

      {/* Background Circle */}
      <Circle
        cx="50"
        cy="50"
        r="48"
        fill={showGradient ? "url(#vGradient)" : color}
      />

      {/* Inner Shadow Circle */}
      <Circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1"
        opacity="0.2"
      />

      {/* The "V" Letter - Bold and Modern */}
      <G>
        {/* Main V Shape */}
        <Path
          d="M25 25 L50 78 L75 25"
          fill="none"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner V highlight */}
        <Path
          d="M30 28 L50 72 L70 28"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.3"
        />
      </G>

      {/* Sparkle dots around V */}
      <Circle cx="20" cy="20" r="3" fill="#ffffff" opacity="0.8" />
      <Circle cx="80" cy="20" r="3" fill="#ffffff" opacity="0.8" />
      <Circle cx="50" cy="90" r="2" fill="#ffffff" opacity="0.6" />
    </Svg>
  );
};

// Simple "V" Logo (fallback/minimal version)
export const VortexLogoSimple: React.FC<VortexLogoProps> = ({
  size = 40,
  color = '#fe591b'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="simpleVGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ff7a45" />
          <Stop offset="100%" stopColor="#fe591b" />
        </LinearGradient>
      </Defs>

      {/* Background Circle */}
      <Circle
        cx="50"
        cy="50"
        r="48"
        fill="url(#simpleVGradient)"
      />

      {/* The "V" Letter */}
      <Path
        d="M25 25 L50 78 L75 25"
        fill="none"
        stroke="#ffffff"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Icon only "V" without background (for tab bar etc)
export const VortexIconV: React.FC<VortexLogoProps> = ({
  size = 24,
  color = '#fe591b'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M15 15 L50 85 L85 15"
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Animated-style V with energy lines
export const VortexLogoEnergy: React.FC<VortexLogoProps> = ({
  size = 60,
  color = '#fe591b',
  showGradient = true
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ffb347" />
          <Stop offset="30%" stopColor="#ff7a45" />
          <Stop offset="70%" stopColor="#fe591b" />
          <Stop offset="100%" stopColor="#e64a00" />
        </LinearGradient>
      </Defs>

      {/* Outer glow ring */}
      <Circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke={showGradient ? "url(#energyGradient)" : color}
        strokeWidth="2"
        opacity="0.4"
      />

      {/* Inner circle */}
      <Circle
        cx="50"
        cy="50"
        r="42"
        fill={showGradient ? "url(#energyGradient)" : color}
      />

      {/* Main V */}
      <Path
        d="M22 22 L50 80 L78 22"
        fill="none"
        stroke="#ffffff"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Energy lines */}
      <Path
        d="M10 50 L20 50"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />
      <Path
        d="M80 50 L90 50"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />
      <Path
        d="M50 5 L50 15"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Corner sparkles */}
      <Circle cx="15" cy="15" r="4" fill="#ffffff" opacity="0.9" />
      <Circle cx="85" cy="15" r="4" fill="#ffffff" opacity="0.9" />
      <Circle cx="50" cy="95" r="3" fill="#ffffff" opacity="0.7" />
    </Svg>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
