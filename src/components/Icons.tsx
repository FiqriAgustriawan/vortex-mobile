import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Icon sizes
export const IconSize = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
  xxl: 40,
};

// Common Icons Component
interface IconProps {
  size?: number;
  color?: string;
}

// Tab Bar Icons
export const HomeIcon: React.FC<IconProps & { focused?: boolean }> = ({ size = 24, color, focused }) => (
  <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />
);

export const HistoryIcon: React.FC<IconProps & { focused?: boolean }> = ({ size = 24, color, focused }) => (
  <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />
);

export const ProfileIcon: React.FC<IconProps & { focused?: boolean }> = ({ size = 24, color, focused }) => (
  <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
);

export const ImageGenIcon: React.FC<IconProps & { focused?: boolean }> = ({ size = 24, color, focused }) => (
  <Ionicons name={focused ? 'image' : 'image-outline'} size={size} color={color} />
);

// Model Icons
export const FlashIcon: React.FC<IconProps> = ({ size = 24, color = '#fe591b' }) => (
  <Ionicons name="flash" size={size} color={color} />
);

export const BrainIcon: React.FC<IconProps> = ({ size = 24, color = '#8B5CF6' }) => (
  <MaterialCommunityIcons name="brain" size={size} color={color} />
);

export const VisionIcon: React.FC<IconProps> = ({ size = 24, color = '#10B981' }) => (
  <Ionicons name="eye" size={size} color={color} />
);

export const CodeIcon: React.FC<IconProps> = ({ size = 24, color = '#3B82F6' }) => (
  <Ionicons name="code-slash" size={size} color={color} />
);

// Chat Icons
export const SendIcon: React.FC<IconProps> = ({ size = 24, color = '#FFFFFF' }) => (
  <Ionicons name="send" size={size} color={color} />
);

export const BackIcon: React.FC<IconProps> = ({ size = 24, color = '#FFFFFF' }) => (
  <Ionicons name="chevron-back" size={size} color={color} />
);

export const ChatBubbleIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <Ionicons name="chatbubble-ellipses" size={size} color={color} />
);

// Settings Icons
export const MoonIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <Ionicons name="moon" size={size} color={color} />
);

export const SunIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <Ionicons name="sunny" size={size} color={color} />
);

export const NotificationIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <Ionicons name="notifications" size={size} color={color} />
);

export const GlobeIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <Ionicons name="globe" size={size} color={color} />
);

export const StorageIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <Ionicons name="folder" size={size} color={color} />
);

export const TrashIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <Ionicons name="trash" size={size} color={color} />
);

export const HelpIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <Ionicons name="help-circle" size={size} color={color} />
);

export const FeedbackIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <Ionicons name="chatbox-ellipses" size={size} color={color} />
);

export const InfoIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <Ionicons name="information-circle" size={size} color={color} />
);

export const SoundIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <Ionicons name="volume-high" size={size} color={color} />
);

export const FontSizeIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <MaterialCommunityIcons name="format-size" size={size} color={color} />
);

// Action Icons
export const SparkleIcon: React.FC<IconProps> = ({ size = 24, color = '#fe591b' }) => (
  <Ionicons name="sparkles" size={size} color={color} />
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 24, color = '#FFFFFF' }) => (
  <Ionicons name="arrow-forward" size={size} color={color} />
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, color }) => (
  <Ionicons name="chevron-forward" size={size} color={color} />
);

// Prompt Icons
export const LightbulbIcon: React.FC<IconProps> = ({ size = 20, color }) => (
  <Ionicons name="bulb" size={size} color={color} />
);

export const PencilIcon: React.FC<IconProps> = ({ size = 20, color }) => (
  <Ionicons name="pencil" size={size} color={color} />
);

export const SearchIcon: React.FC<IconProps> = ({ size = 20, color }) => (
  <Ionicons name="search" size={size} color={color} />
);

export const TerminalIcon: React.FC<IconProps> = ({ size = 20, color }) => (
  <Ionicons name="terminal" size={size} color={color} />
);

// Status Icons
export const CheckmarkIcon: React.FC<IconProps> = ({ size = 20, color = '#10B981' }) => (
  <Ionicons name="checkmark-circle" size={size} color={color} />
);

export const ClockIcon: React.FC<IconProps> = ({ size = 20, color }) => (
  <Ionicons name="time" size={size} color={color} />
);
