import fs from 'node:fs';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveVoiceId } from '$lib/voices';

// Try env var first, fall back to .env file
function getElevenLabsKey(): string {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  try {
    const envPath = path.resolve('.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const m = line.match(/^ELEVENLABS_API_KEY=(.+)$/);
      if (m) return m[1].trim();
    }
  } catch {}
  return '';
}

const ELEVENLABS_KEY = getElevenLabsKey();
const AUDIO_DIR = path.resolve('static/stream-overlay/audio');

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const text = (body.text || '').trim();
    const voiceKey = (body.voiceKey || 'warm-narrator').trim();
    const customId = (body.customVoiceId || '').trim();
    const voiceId = resolveVoiceId(voiceKey, customId);

    if (!text) {
      return json({ success: false, error: 'No text provided' }, { status: 400 });
    }

    if (!ELEVENLABS_KEY) {
      return json({ success: false, error: 'ELEVENLABS_API_KEY not configured' }, { status: 500 });
    }

    // Generate TTS via ElevenLabs
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.4, similarity_boost: 0.75 },
      }),
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      return json({ success: false, error: `ElevenLabs error: ${errText}` }, { status: 502 });
    }

    // Save audio file
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
    const filename = `cohost_${Date.now()}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);
    const buffer = Buffer.from(await ttsRes.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    const audioUrl = `/stream-overlay/audio/${filename}`;

    return json({
      success: true,
      audioUrl,
      filename,
      size: buffer.length,
    });
  } catch (e) {
    return json({ success: false, error: String(e) }, { status: 500 });
  }
};
