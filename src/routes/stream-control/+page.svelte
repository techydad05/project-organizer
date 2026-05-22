<script lang="ts">
  import { VOICE_LIST, DUMB_VOICE_LIST } from '$lib/voices';

  let currentProject = $state('Project Organizer');
  let viewers = $state('0');
  let followers = $state('0');
  let tickerTag = $state('Build');
  let tickerText = $state('');
  let alertIcon = $state('🎉');
  let alertText = $state('');
  let statusMsg = $state('');

  // Cohost test state
  let cohostUsername = $state('Viewer');
  let cohostComment = $state('');
  let cohostStatus = $state('');
  let lastCohostDialogue = $state('');

  // Cohost voice
  let selectedVoiceKey = $state('warm-narrator');
  let customVoiceId = $state('');

  // Dumb comment state
  let dumbComment = $state('');
  let dumbUsername = $state('Confused Viewer');
  let dumbStatus = $state('');
  let dumbVoiceKey = $state('goofball');
  let dumbCustomVoiceId = $state('');

  async function updateState(partial: Record<string, any>) {
    try {
      const res = await fetch('/api/stream-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial)
      });
      const data = await res.json();
      if (data.success) statusMsg = '✓ Updated';
      else statusMsg = '✗ Error: ' + (data.error || 'unknown');
    } catch (e) {
      statusMsg = '✗ Failed to connect';
    }
    setTimeout(() => statusMsg = '', 3000);
  }

  function updateProject() { updateState({ currentProject }); }

  function updateStats() {
    updateState({
      viewers: parseInt(viewers) || 0,
      followers: parseInt(followers) || 0
    });
  }

  function sendTicker() {
    if (!tickerText.trim()) return;
    updateState({ ticker: [{ tag: tickerTag, text: tickerText.trim() }] });
    tickerText = '';
  }

  function sendAlert() {
    if (!alertText.trim()) return;
    updateState({ alert: { icon: alertIcon, text: alertText.trim() } });
    alertText = '';
  }

  function updateVoice() {
    const preset = VOICE_LIST.find(v => v.key === selectedVoiceKey);
    const voiceId = customVoiceId.trim() || (preset?.id || 'pNInz6obpgDQGcFmaJgB');
    const voiceName = customVoiceId.trim()
      ? `Custom (${customVoiceId.slice(0, 12)}...)`
      : (preset?.name || 'Unknown');
    updateState({ cohostVoice: { id: voiceId, name: voiceName } });
  }

  function updateDumbVoice() {
    const preset = DUMB_VOICE_LIST.find(v => v.key === dumbVoiceKey);
    const voiceId = dumbCustomVoiceId.trim() || (preset?.id || 'pNInz6obpgDQGcFmaJgB');
    const voiceName = dumbCustomVoiceId.trim()
      ? `Custom (${dumbCustomVoiceId.slice(0, 12)}...)`
      : (preset?.name || 'Unknown');
    updateState({ dumbCommentVoice: { id: voiceId, name: voiceName } });
  }

  async function testCohost() {
    if (!cohostComment.trim()) return;
    cohostStatus = '⏳ Processing dialogue + TTS...';
    lastCohostDialogue = '';
    try {
      const voiceId = customVoiceId.trim() || (VOICE_LIST.find(v => v.key === selectedVoiceKey)?.id || 'pNInz6obpgDQGcFmaJgB');
      const res = await fetch('/api/cohost-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: cohostComment.trim(),
          username: cohostUsername.trim() || 'Viewer',
          voiceId: voiceId
        })
      });
      const data = await res.json();
      if (data.success) {
        lastCohostDialogue = data.cohost?.dialogue || '';
        cohostStatus = data.audioUrl
          ? '✓ Dialogue + TTS sent to overlay!'
          : '✓ Dialogue sent (no TTS)';
      } else {
        cohostStatus = '✗ Error: ' + (data.error || 'unknown');
      }
    } catch (e) {
      cohostStatus = '✗ Failed to connect';
    }
    cohostComment = '';
    setTimeout(() => cohostStatus = '', 5000);
  }

  async function testDumbComment() {
    if (!dumbComment.trim()) return;
    dumbStatus = '⏳ Generating TTS...';
    try {
      const voiceId = dumbCustomVoiceId.trim() || (DUMB_VOICE_LIST.find(v => v.key === dumbVoiceKey)?.id || 'pNInz6obpgDQGcFmaJgB');
      const res = await fetch('/api/dumb-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: dumbComment.trim(),
          username: dumbUsername.trim() || 'Confused Viewer',
          voiceId: voiceId
        })
      });
      const data = await res.json();
      dumbStatus = data.audioUrl
        ? '✓ Dumb comment + TTS sent to overlay!'
        : '✗ Error: ' + (data.error || 'TTS failed');
    } catch (e) {
      dumbStatus = '✗ Failed to connect';
    }
    dumbComment = '';
    setTimeout(() => dumbStatus = '', 5000);
  }

  async function loadVoiceState() {
    try {
      const res = await fetch('/api/stream-state?' + Date.now());
      const data = await res.json();
      if (data.cohostVoice) {
        const found = VOICE_LIST.find(v => v.id === data.cohostVoice.id);
        if (found) { selectedVoiceKey = found.key; }
        else if (data.cohostVoice.id) { customVoiceId = data.cohostVoice.id; selectedVoiceKey = 'warm-narrator'; }
      }
      if (data.dumbCommentVoice) {
        const found = DUMB_VOICE_LIST.find(v => v.id === data.dumbCommentVoice.id);
        if (found) { dumbVoiceKey = found.key; }
        else if (data.dumbCommentVoice.id) { dumbCustomVoiceId = data.dumbCommentVoice.id; dumbVoiceKey = 'goofball'; }
      }
    } catch {}
  }

  $effect(() => { loadVoiceState(); });
</script>

<div class="control-panel">
  <h1>Stream Control Panel</h1>
  <p class="subtitle">Changes appear on your overlay within 5 seconds</p>

  <div class="section">
    <h2>Current Project</h2>
    <div class="row">
      <input type="text" bind:value={currentProject} placeholder="Project Organizer" />
      <button onclick={updateProject}>Update</button>
    </div>
  </div>

  <div class="section">
    <h2>Stats</h2>
    <div class="row">
      <label>Viewers: <input type="number" bind:value={viewers} class="small" /></label>
      <label>Followers: <input type="number" bind:value={followers} class="small" /></label>
      <button onclick={updateStats}>Update</button>
    </div>
  </div>

  <div class="section">
    <h2>Ticker Message</h2>
    <div class="row">
      <select bind:value={tickerTag}>
        <option>Build</option><option>Idea</option><option>Learn</option>
        <option>Chat</option><option>News</option><option>Thought</option><option>Dumb</option>
      </select>
      <input type="text" bind:value={tickerText} placeholder="What are you working on?" class="wide" />
      <button onclick={sendTicker}>Send</button>
    </div>
  </div>

  <div class="section">
    <h2>Alert Popup</h2>
    <div class="row">
      <input type="text" bind:value={alertIcon} class="small" placeholder="🎉" />
      <input type="text" bind:value={alertText} placeholder="Welcome new viewer!" class="wide" />
      <button onclick={sendAlert}>Send</button>
    </div>
  </div>

  <!-- 🎭 Cohost Voice Section -->
  <div class="section voice-section">
    <h2>🎭 Cohost Voice (thoughtful comments)</h2>
    <p class="hint">AI generates dialogue, reads in this character voice</p>
    <div class="row">
      <select bind:value={selectedVoiceKey} class="voice-select">
        <optgroup label="━━ Normal Voices (daily stream) ━━">
          {#each VOICE_LIST.filter(v => v.category === 'normal') as voice}
            <option value={voice.key}>{voice.name} &mdash; {voice.description}</option>
          {/each}
        </optgroup>
        <optgroup label="━━ Character Voices (Super Chat / fun) ━━">
          {#each VOICE_LIST.filter(v => v.category === 'character') as voice}
            <option value={voice.key}>{voice.name} &mdash; {voice.description}</option>
          {/each}
        </optgroup>
      </select>
      <button onclick={updateVoice}>Save</button>
    </div>
    <div class="row" style="margin-top: 8px;">
      <span class="hint">Paste any ElevenLabs Voice ID:</span>
      <input type="text" bind:value={customVoiceId} placeholder="e.g. 21m00Tcm4TlvDq8ikWAM" class="medium" />
    </div>
  </div>

  <!-- 🤪 Dumb Comment Voice Section -->
  <div class="section dumb-section">
    <h2>🤪 Dumb Comment Reader (stupid comments)</h2>
    <p class="hint">Non-hateful dumb comments get read verbatim in a silly voice</p>
    <div class="row">
      <select bind:value={dumbVoiceKey} class="voice-select">
        {#each DUMB_VOICE_LIST as voice}
          <option value={voice.key}>{voice.name} &mdash; {voice.description}</option>
        {/each}
      </select>
      <button onclick={updateDumbVoice}>Save</button>
    </div>
    <div class="row" style="margin-top: 8px;">
      <span class="hint">Paste Patrick/SpongeBob/etc voice ID:</span>
      <input type="text" bind:value={dumbCustomVoiceId} placeholder="Find at elevenlabs.io/app/voice-library" class="medium" />
    </div>
  </div>

  <!-- 🎙️ Cohost Test -->
  <div class="section cohost-section">
    <h2>🎙️ Test Cohost (thoughtful comment → dialogue)</h2>
    <div class="row">
      <input type="text" bind:value={cohostUsername} placeholder="Viewer name" class="smallish" />
      <input type="text" bind:value={cohostComment} placeholder="Type a smart comment..." class="wide" />
      <button onclick={testCohost} class="cohost-btn">Test</button>
    </div>
    {#if lastCohostDialogue}
      <div class="preview-bubble purple-border">
        <span class="label cohost-label">🎙️ CoHost Dialogue</span>
        {lastCohostDialogue}
      </div>
    {/if}
    <div class="status-msg">{cohostStatus}</div>
  </div>

  <!-- 🤪 Dumb Comment Test -->
  <div class="section dumb-test-section">
    <h2>🤪 Test Dumb Comment (stupid → read aloud)</h2>
    <div class="row">
      <input type="text" bind:value={dumbUsername} placeholder="Confused Viewer" class="smallish" />
      <input type="text" bind:value={dumbComment} placeholder="Type a dumb comment..." class="wide" />
      <button onclick={testDumbComment} class="dumb-btn">Read Aloud</button>
    </div>
    <div class="status-msg">{dumbStatus}</div>
  </div>

  <div class="status" class:show={statusMsg !== ''}>{statusMsg}</div>
</div>

<style>
  :global(body) {
    background: #0d0d1a;
    color: #ccc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 40px;
  }
  .control-panel { max-width: 640px; margin: 0 auto; }
  h1 { color: #e0e0e0; font-size: 24px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 32px; }
  .section { margin-bottom: 24px; background: #1a1a2e; border-radius: 10px; padding: 20px; }
  .section h2 { color: #aaa; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
  .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  input, select { background: #12122a; border: 1px solid #333; border-radius: 6px; padding: 8px 12px; color: #e0e0e0; font-size: 14px; font-family: inherit; }
  input:focus, select:focus { outline: none; border-color: #2d9cdb; }
  .small { width: 80px; }
  .smallish { width: 130px; }
  .medium { width: 260px; }
  .wide { flex: 1; min-width: 200px; }
  .voice-select { flex: 1; min-width: 300px; }
  label { display: flex; align-items: center; gap: 6px; color: #888; font-size: 13px; }
  button { background: #2d9cdb; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
  button:hover { background: #2488c3; }
  .status { text-align: center; font-size: 14px; color: #2d9cdb; height: 24px; opacity: 0; transition: opacity 0.3s; }
  .status.show { opacity: 1; }
  .status-msg { margin-top: 8px; font-size: 12px; color: #2d9cdb; min-height: 18px; }
  .hint { color: #666; font-size: 12px; margin-bottom: 12px; }
  /* Voice section */
  .voice-section { border: 1px solid rgba(255, 193, 7, 0.2); }
  /* Dumb section */
  .dumb-section { border: 1px solid rgba(255, 165, 0, 0.25); }
  /* Cohost test */
  .cohost-section { border: 1px solid rgba(45, 156, 219, 0.2); }
  .cohost-btn { background: #9b59b6 !important; }
  .cohost-btn:hover { background: #8e44ad !important; }
  /* Dumb test */
  .dumb-test-section { border: 1px solid rgba(255, 165, 0, 0.2); }
  .dumb-btn { background: #e67e22 !important; }
  .dumb-btn:hover { background: #d35400 !important; }
  /* Preview bubbles */
  .preview-bubble { margin-top: 14px; padding: 12px 16px; background: #0d0d1a; border-radius: 10px; color: #ccc; font-size: 14px; line-height: 1.5; }
  .purple-border { border-left: 3px solid #9b59b6; }
  .label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .cohost-label { color: #9b59b6; }
</style>
