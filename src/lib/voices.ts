// Shared voice preset definitions for the cohost TTS system
// Used by: control panel UI, cohost-tts endpoint, cohost-test endpoint

export interface VoicePreset {
  key: string;
  id: string;
  name: string;
  description: string;
  category: 'normal' | 'character' | 'dumb';
}

// ── COHOST VOICES ──
// Normal / professional (everyday stream use)
const NORMAL_VOICES: Record<string, { id: string; name: string; description: string }> = {
  'adam':     { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam',     description: 'Rich, warm, professional narrator' },
  'sarah':    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',    description: 'Mature, reassuring, confident' },
  'alice':    { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice',    description: 'Clear, engaging educator' },
  'chris':    { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris',    description: 'Charming, down-to-earth' },
  'eric':     { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric',     description: 'Smooth, trustworthy broadcaster' },
  'bella':    { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella',    description: 'Professional, bright, warm' },
  'river':    { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River',    description: 'Relaxed, neutral, informative' },
  'bill':     { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill',     description: 'Wise, mature, balanced' },
  'daniel':   { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel',   description: 'Steady broadcaster' },
  'george':   { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George',   description: 'Warm, captivating storyteller' },
  'brian':    { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian',    description: 'Deep, resonant, comforting' },
  'lily':     { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily',     description: 'Velvety, smooth actress quality' },
  'roger':    { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger',    description: 'Laid-back, casual, resonant' },
  'matilda':  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda',  description: 'Knowledgeable, professional' },
};

// Character / fun voices (for Super Chats or entertainment)
const CHARACTER_VOICES: Record<string, { id: string; name: string; description: string }> = {
  'batman':           { id: 'ODq5zmih8GnVKj1QbQzB', name: 'Dark & Gravelly', description: '🔥 Deep, rough, Batman-like growl' },
  'trump':            { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Boisterous',     description: '🔥 Loud, commanding, Trump swagger' },
  'obama':            { id: 'IKne3meq5aSn9XLyUdCD', name: 'Calm Authority', description: '🔥 Measured, smooth, Obama presence' },
  'morgan':           { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'Deep Storyteller', description: '🔥 Resonant, Morgan Freeman depth' },
  'snoop':            { id: 'SAz9YHcvj6GT2YYXdXww', name: 'Smooth Hustler',  description: '🔥 Laid-back Snoop Dogg vibe' },
  'gordon':           { id: 'cgSgspJ2msm6clMCkdW9', name: 'Harsh Critic',    description: '🔥 Sharp Gordon Ramsay energy' },
  'british-dry':      { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'English Dry',     description: '🔥 Dry, witty British narrator' },
  'liam-energetic':   { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Hyper Energetic', description: '🔥 Loud, hyped-up, SpongeBob energy' },
};

// Merge: normals first, then characters
export const VOICE_PRESETS: Record<string, { id: string; name: string; description: string }> = {
  ...NORMAL_VOICES,
  ...CHARACTER_VOICES,
};

// ── DUMB COMMENT VOICES (silly/goofy/dopey) ──
export const DUMB_VOICE_PRESETS: Record<string, { id: string; name: string; description: string }> = {
  'patrick-star': { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Patrick Star',  description: '🤪 Over-the-top, loud, silly starfish' },
  'goofball':     { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Goofball',      description: '🤪 Husky, sly, cartoonish trickster' },
  'spongebob':    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'SpongeBob',     description: '🤪 High-energy, hyper, squeaky' },
  'chill-dude':   { id: 'SAz9YHcvj6GT2YYXdXww', name: 'Chill Dude',   description: '🤪 Laid-back surfer, stupid voice' },
  'squeaky':      { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Squeaky',       description: '🤪 High-pitched cartoon mouse' },
  'robot':        { id: 'cgSgspJ2msm6clMCkdW9', name: 'Robot Voice',   description: '🤪 Monotone, deadpan, robotic' },
  'harry-warrior':{ id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Warrior Voice', description: '🤪 Over-the-top battle shout' },
};

export const VOICE_LIST: VoicePreset[] = [
  // Normal voices first
  ...Object.entries(NORMAL_VOICES).map(([key, v]) => ({ key, ...v, category: 'normal' as const })),
  // Then characters (separator)
  ...Object.entries(CHARACTER_VOICES).map(([key, v]) => ({ key, ...v, category: 'character' as const })),
];

export const DUMB_VOICE_LIST: VoicePreset[] = Object.entries(DUMB_VOICE_PRESETS).map(([key, v]) => ({
  key, ...v, category: 'dumb' as const
}));

export function resolveVoiceId(voiceKey: string, customId?: string, isDumb?: boolean): string {
  if (customId?.trim()) return customId.trim();
  const presets = isDumb ? DUMB_VOICE_PRESETS : VOICE_PRESETS;
  return presets[voiceKey]?.id || 'pNInz6obpgDQGcFmaJgB';
}

export function resolveVoiceName(voiceKey: string, customId?: string, isDumb?: boolean): string {
  if (customId?.trim()) return `Custom (${customId.slice(0, 12)}...)`;
  const presets = isDumb ? DUMB_VOICE_PRESETS : VOICE_PRESETS;
  return presets[voiceKey]?.name || 'Adam';
}
