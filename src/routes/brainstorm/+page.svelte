<script lang="ts">
  import { onMount } from 'svelte';

  let session: {
    title: string;
    date: string;
    updated: string;
    sections: Array<{
      id: string;
      heading: string;
      body: string;
      timestamp: string;
    }>;
  } | null = $state(null);
  let loading = $state(true);
  let error = $state('');
  let autoRefresh = $state(true);
  let lastRefresh = $state('');
  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  async function loadSession() {
    try {
      const res = await fetch(`/brainstorm/session.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      session = data;
      lastRefresh = new Date().toLocaleTimeString();
      error = '';
    } catch (e) {
      error = 'Could not load brainstorm session';
      console.error(e);
    } finally {
      loading = false;
    }
  }

  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
  }

  function formatBody(body: string): string {
    // Convert markdown-like formatting to HTML
    return body
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`(.+?)`/g, '<code>$1</code>')
      // Newlines to <br> (double newlines = paragraphs)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  onMount(() => {
    loadSession();

    // Auto-refresh every 15 seconds
    refreshInterval = setInterval(() => {
      if (autoRefresh) loadSession();
    }, 15000);

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  });
</script>

<svelte:head>
  <title>Brainstorm | Project Organizer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</svelte:head>

<div class="brainstorm-page">
  <!-- Header -->
  <header class="bs-header">
    <div class="bs-title-row">
      <div class="bs-title-group">
        <span class="bs-badge">🧠 BRAINSTORM</span>
        {#if session}
          <h1 class="bs-title">{session.title}</h1>
          <p class="bs-date">{session.date}</p>
        {/if}
      </div>
      <div class="bs-controls">
        <button
          class="bs-refresh-btn"
          onclick={loadSession}
          title="Refresh now"
        >
          ↻
        </button>
        <label class="bs-toggle">
          <input type="checkbox" checked={autoRefresh} onchange={toggleAutoRefresh} />
          <span class="bs-toggle-label">Auto</span>
        </label>
      </div>
    </div>
    {#if lastRefresh}
      <p class="bs-last-refresh">Last updated: {lastRefresh}</p>
    {/if}
  </header>

  <!-- Loading -->
  {#if loading}
    <div class="bs-loading">
      <div class="bs-spinner"></div>
      <p>Loading brainstorm...</p>
    </div>
  <!-- Error -->
  {:else if error}
    <div class="bs-error">
      <span class="bs-error-icon">⚠️</span>
      <p>{error}</p>
      <button class="bs-retry-btn" onclick={loadSession}>Retry</button>
    </div>
  <!-- Content -->
  {:else if session}
    <div class="bs-content">
      {#each session.sections as section, i}
        <section class="bs-section" id={section.id}>
          <div class="bs-section-header">
            <span class="bs-section-num">{(i + 1).toString().padStart(2, '0')}</span>
            <h2 class="bs-section-title">{section.heading}</h2>
          </div>
          <div class="bs-section-body">
            {@html formatBody(section.body)}
          </div>
          <div class="bs-section-timestamp">
            {new Date(section.timestamp).toLocaleString()}
          </div>
        </section>
      {/each}
    </div>

    <!-- Footer -->
    <footer class="bs-footer">
      <p>
        This page auto-refreshes every 15s during live brainstorming.
        <br>
        Final sessions are archived to gbrain for permanent search.
      </p>
    </footer>
  {/if}
</div>

<style>
  .brainstorm-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 0 48px;
  }

  /* ── Header ── */
  .bs-header {
    margin-bottom: 32px;
  }

  .bs-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .bs-title-group {
    flex: 1;
  }

  .bs-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    padding: 4px 10px;
    border-radius: 4px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: #fff;
    margin-bottom: 8px;
  }

  .bs-title {
    font-size: 24px;
    font-weight: 700;
    color: #e0e0e0;
    margin: 0 0 4px;
    line-height: 1.3;
  }

  .bs-date {
    font-size: 13px;
    color: #666;
    margin: 0;
  }

  .bs-last-refresh {
    font-size: 12px;
    color: #555;
    margin: 8px 0 0;
  }

  .bs-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    padding-top: 4px;
  }

  .bs-refresh-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: 1px solid #333;
    background: #1a1a2e;
    color: #888;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .bs-refresh-btn:hover {
    background: #2a2a3e;
    color: #ccc;
  }

  .bs-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 12px;
    color: #666;
  }

  .bs-toggle input {
    accent-color: #7c3aed;
  }

  .bs-toggle-label {
    font-weight: 500;
  }

  /* ── Loading ── */
  .bs-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    color: #666;
    gap: 16px;
  }

  .bs-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #2a2a3e;
    border-top-color: #7c3aed;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Error ── */
  .bs-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 0;
    color: #ff6b6b;
    gap: 12px;
  }

  .bs-error-icon {
    font-size: 32px;
  }

  .bs-error p {
    font-size: 14px;
    margin: 0;
  }

  .bs-retry-btn {
    padding: 8px 20px;
    border-radius: 6px;
    border: 1px solid #ff6b6b;
    background: transparent;
    color: #ff6b6b;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  }

  .bs-retry-btn:hover {
    background: rgba(255, 107, 107, 0.1);
  }

  /* ── Sections ── */
  .bs-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .bs-section {
    background: #12122a;
    border: 1px solid #2a2a3e;
    border-radius: 12px;
    padding: 24px;
    transition: border-color 0.15s;
  }

  .bs-section:hover {
    border-color: rgba(124, 58, 237, 0.3);
  }

  .bs-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .bs-section-num {
    font-size: 13px;
    font-weight: 700;
    color: #7c3aed;
    font-family: 'SF Mono', 'Fira Code', monospace;
    opacity: 0.7;
  }

  .bs-section-title {
    font-size: 18px;
    font-weight: 600;
    color: #e0e0e0;
    margin: 0;
  }

  .bs-section-body {
    font-size: 15px;
    line-height: 1.7;
    color: #b0b0c0;
  }

  .bs-section-body :global(p) {
    margin: 0 0 12px;
  }

  .bs-section-body :global(p:last-child) {
    margin-bottom: 0;
  }

  .bs-section-body :global(strong) {
    color: #d0d0e0;
    font-weight: 600;
  }

  .bs-section-body :global(code) {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 13px;
    background: #1a1a34;
    padding: 2px 6px;
    border-radius: 4px;
    color: #a78bfa;
  }

  .bs-section-body :global(br) {
    display: block;
    margin: 4px 0;
  }

  .bs-section-timestamp {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #1e1e34;
    font-size: 11px;
    color: #555;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  /* ── Footer ── */
  .bs-footer {
    margin-top: 32px;
    padding: 20px;
    background: #0d0d1a;
    border: 1px solid #1e1e30;
    border-radius: 8px;
    text-align: center;
  }

  .bs-footer p {
    font-size: 13px;
    color: #555;
    margin: 0;
    line-height: 1.6;
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .bs-title {
      font-size: 20px;
    }

    .bs-section {
      padding: 16px;
    }

    .bs-section-title {
      font-size: 16px;
    }

    .bs-section-body {
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    .bs-header {
      margin-bottom: 20px;
    }

    .bs-controls {
      gap: 4px;
    }

    .bs-toggle-label {
      display: none;
    }

    .bs-section {
      padding: 14px;
      border-radius: 8px;
    }
  }
</style>