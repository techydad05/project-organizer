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
    const username = (body.username || 'Viewer').trim();
    const voiceId = (body.voiceId || '').trim() || resolveVoiceId('warm-narrator');

    if (!comment) {
      return json({ success: false, error: 'No comment provided' }, { status: 400 });
    }

    // Generate cohost response using OpenRouter
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
    let cohostDialogue = '';

    if (OPENROUTER_KEY) {
      try {
        const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://projects.idevsites.com',
            'X-Title': 'Stream Cohost'
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-v4-flash',
            messages: [
              {
                role: 'system',
                content: `You are the AI cohost for Ivan's stream. You pick thoughtful viewer comments and construct short, warm dialogue segments for Ivan to discuss.

Rules:
- Be warm, conversational, not robotic
- Call out the viewer by name
- Keep it to 1-2 sentences
- Sound like a sharp producer in Ivan's ear, not a corporate chatbot
- Don't use emojis or hashtags
- Never say "thank you for your contribution" — be natural
- Example: "@ViewerName just dropped something worth talking about — [point] — Ivan, what do you think?"`
              },
              {
                role: 'user',
                content: `Viewer "${username}" just typed this comment: "${comment}"

Generate what the cohost says to Ivan. Just the dialogue text, nothing else.`
              }
            ],
            max_tokens: 100,
            temperature: 0.7
          })
        });

        const aiData = await aiRes.json();
        cohostDialogue = aiData?.choices?.[0]?.message?.content?.trim() || '';
      } catch (e) {
        cohostDialogue = '';
      }
    }

    // Fallback if AI failed or no key
    if (!cohostDialogue) {
      cohostDialogue = `@${username} just said: "${comment}" — Ivan, that's worth talking about.`;
    }

    // Generate TTS audio for the cohost dialogue
    let audioUrl = '';
    if (ELEVENLABS_KEY) {
      try {
        const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: cohostDialogue,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.4, similarity_boost: 0.75 },
          }),
        });

        if (ttsRes.ok) {
          fs.mkdirSync(AUDIO_DIR, { recursive: true });
          const filename = `cohost_${Date.now()}.mp3`;
          const filepath = path.join(AUDIO_DIR, filename);
          const buffer = Buffer.from(await ttsRes.arrayBuffer());
          fs.writeFileSync(filepath, buffer);
          audioUrl = `/stream-overlay/audio/${filename}`;
        }
      } catch (e) {
        // TTS failure is non-fatal — dialogue still works without audio
        console.error('TTS failed:', e);
      }
    }

    // Write cohost dialogue + audio URL to overlay state
    const cohostEntry: Record<string, any> = {
      username: username,
      comment: comment,
      dialogue: cohostDialogue,
      timestamp: Date.now()
    };
    if (audioUrl) {
      cohostEntry.audioUrl = audioUrl;
    }

    let state: any = { currentProject: 'Project Organizer', viewers: 0, followers: 0, ticker: [], alert: null, cohost: null };
    try {
      const existing = fs.readFileSync(STATE_FILE, 'utf-8');
      state = JSON.parse(existing);
    } catch {}

    state.cohost = cohostEntry;

    // Also add to ticker
    if (!Array.isArray(state.ticker)) state.ticker = [];
    state.ticker.push({ tag: 'Chat', text: `${username}: ${comment}` });
    if (state.ticker.length > 50) state.ticker = state.ticker.slice(-50);

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    return json({ success: true, cohost: cohostEntry, audioUrl });
  } catch (e) {
    return json({ success: false, error: String(e) }, { status: 400 });
  }
};
