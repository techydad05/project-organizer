import fs from 'node:fs';
import path from 'node:path';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const STATE_DIR = process.env.STATE_DIR || path.resolve('static/stream-overlay');
const STATE_FILE = path.join(STATE_DIR, 'state.json');

export const GET: RequestHandler = async () => {
  try {
    const data = fs.readFileSync(STATE_FILE, 'utf-8');
    return json(JSON.parse(data));
  } catch {
    return json({
      currentProject: 'Project Organizer',
      viewers: 0,
      followers: 0,
      ticker: [],
      alert: null
    });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    let state: any = { currentProject: 'Project Organizer', viewers: 0, followers: 0, ticker: [], alert: null };

    try {
      const existing = fs.readFileSync(STATE_FILE, 'utf-8');
      state = JSON.parse(existing);
    } catch {}

    if (body.currentProject !== undefined) state.currentProject = body.currentProject;
    if (body.viewers !== undefined) state.viewers = body.viewers;
    if (body.followers !== undefined) state.followers = body.followers;
    if (body.ticker !== undefined) {
      if (!Array.isArray(state.ticker)) state.ticker = [];
      state.ticker.push(...body.ticker);
      // Keep last 50
      if (state.ticker.length > 50) state.ticker = state.ticker.slice(-50);
    }
    if (body.alert !== undefined) state.alert = body.alert;
    if (body.cohost !== undefined) state.cohost = body.cohost;
    if (body.cohostVoice !== undefined) state.cohostVoice = body.cohostVoice;
    if (body.dumbComment !== undefined) state.dumbComment = body.dumbComment;
    if (body.dumbCommentVoice !== undefined) state.dumbCommentVoice = body.dumbCommentVoice;

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    return json({ success: true, state });
  } catch (e) {
    return json({ success: false, error: String(e) }, { status: 400 });
  }
};
