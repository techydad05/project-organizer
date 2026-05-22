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

const STATE_DIR = process.env.STATE_DIR || path.resolve('static/stream-overlay');
const STATE_FILE = path.join(STATE_DIR, 'state.json');
const AUDIO_DIR = path.resolve('static/stream-overlay/audio');
const ELEVENLABS_KEY = getElevenLabsKey();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const comment = (body.comment || '').trim();
    const username = (body.username || 'Anonymous').trim();
    const voiceId = (body.voiceId || '').trim() || resolveVoiceId('goofball', '', true);

    if (!comment) {
      return json({ success: false, error: 'No comment text' }, { status: 400 });
    }

    let audioUrl = '';

    // Generate TTS in silly voice
    if (ELEVENLABS_KEY) {
      try {
        const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: comment,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.3, similarity_boost: 0.8 },
          }),
        });

        if (ttsRes.ok) {
          fs.mkdirSync(AUDIO_DIR, { recursive: true });
          const filename = `dumb_${Date.now()}.mp3`;
          const filepath = path.join(AUDIO_DIR, filename);
          const buffer = Buffer.from(await ttsRes.arrayBuffer());
          fs.writeFileSync(filepath, buffer);
          audioUrl = `/stream-overlay/audio/${filename}`;
        }
      } catch (e) {
        console.error('Dumb comment TTS failed:', e);
      }
    }

    // Write dumb comment to state
    const dumbEntry: Record<string, any> = {
      username: username,
      comment: comment,
      timestamp: Date.now()
    };
    if (audioUrl) {
      dumbEntry.audioUrl = audioUrl;
    }

    let state: any = { currentProject: 'Project Organizer', viewers: 0, followers: 0, ticker: [], alert: null };
    try {
      const existing = fs.readFileSync(STATE_FILE, 'utf-8');
      state = JSON.parse(existing);
    } catch {}

    state.dumbComment = dumbEntry;

    // Also add to ticker with a special tag
    if (!Array.isArray(state.ticker)) state.ticker = [];
    state.ticker.push({ tag: 'Dumb', text: `${username}: ${comment}` });
    if (state.ticker.length > 50) state.ticker = state.ticker.slice(-50);

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    return json({ success: true, dumbComment: dumbEntry, audioUrl });
  } catch (e) {
    return json({ success: false, error: String(e) }, { status: 400 });
  }
};
