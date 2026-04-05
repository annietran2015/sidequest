import type { VibeTagMeta, CadenceMeta } from '@/types';

export const COLORS = {
  cream: '#F5EFE0',
  terracotta: '#C4603A',
  sage: '#7A9E7E',
  bark: '#3D2B1F',
  // Derived
  terracottaLight: '#F0D5C8',
  sageLight: '#D4E8D6',
  barkLight: '#6B5044',
  barkMuted: '#8C7066',
  white: '#FFFFFF',
  error: '#D94F3D',
  errorLight: '#FAE0DD',
  border: '#E8DDD0',
  cardBg: '#FBF7EF',
} as const;

export const VIBE_TAGS: VibeTagMeta[] = [
  { id: 'health', label: 'Health', emoji: '🌿', color: '#7A9E7E' },
  { id: 'active', label: 'Active', emoji: '⚡', color: '#C4603A' },
  { id: 'creative', label: 'Creative', emoji: '🎨', color: '#9B6BBE' },
  { id: 'mindful', label: 'Mindful', emoji: '🧘', color: '#5B9BAF' },
  { id: 'silly', label: 'Silly', emoji: '🤪', color: '#E8A838' },
  { id: 'connect', label: 'Connect', emoji: '🤝', color: '#C4603A' },
  { id: 'mind', label: 'Mind', emoji: '🧠', color: '#6B7FBE' },
  { id: 'grow', label: 'Grow', emoji: '🌱', color: '#7A9E7E' },
  { id: 'reflect', label: 'Reflect', emoji: '🪞', color: '#8C7066' },
  { id: 'together', label: 'Together', emoji: '💫', color: '#C4603A' },
];

export const CADENCES: CadenceMeta[] = [
  { id: 'daily', label: 'Daily', durationHours: 24 },
  { id: 'weekly', label: 'Weekly', durationHours: 168 },
  { id: 'monthly', label: 'Monthly', durationHours: 720 },
];

export const MAX_TITLE_LENGTH = 80;
export const MAX_DESCRIPTION_LENGTH = 200;
export const MAX_BIO_LENGTH = 150;
export const MAX_DISPLAY_NAME_LENGTH = 40;
export const MAX_USERNAME_LENGTH = 20;
export const MIN_USERNAME_LENGTH = 3;
export const MIN_PASSWORD_LENGTH = 8;
