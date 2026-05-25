<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let { project, statusInfo, brainstorm, slug } = data;

  function formatBody(body: string): string {
    let html = body
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    return '<p>' + html + '</p>';
  }
</script>

<svelte:head>
  <title>{project.name} | Project Organizer</title>
</svelte:head>

<div class="project-page">
  <!-- Back link -->
  <a href="/" class="back-link">← Back to projects</a>

  <!-- Header -->
  <header class="project-header">
    <div>
      <h1 class="project-name">{project.name}</h1>
      <div class="project-meta">
        <span class="status-badge" style="background: {statusInfo.color}18; color: {statusInfo.color}; border: 1px solid {statusInfo.color}33">
          {statusInfo.icon} {statusInfo.label}
        </span>
        {#if project.tags.length}
          <div class="tags">
            {#each project.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
        <span class="created-date">Created {new Date(project.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
    {#if project.url}
      <a href={project.url} target="_blank" class="project-link-btn" rel="noopener">
        ↗ Open
      </a>
    {/if}
  </header>

  <!-- Reason -->
  {#if project.reason}
    <section class="section">
      <h2 class="section-title">Why I Care</h2>
      <p class="section-body">{project.reason}</p>
    </section>
  {/if}

  <!-- Notes -->
  {#if project.notes}
    <section class="section">
      <h2 class="section-title">Notes</h2>
      <p class="section-body">{project.notes}</p>
    </section>
  {/if}

  <!-- Abandon reason -->
  {#if project.abandonReason}
    <section class="section abandon">
      <h2 class="section-title">🗑 Abandoned</h2>
      <p class="section-body">{project.abandonReason}</p>
    </section>
  {/if}

  <!-- Brainstorm -->
  <section class="section brainstorm">
    <div class="brainstorm-header">
      <h2 class="section-title">🧠 Brainstorm</h2>
      {#if brainstorm}
        <span class="update-note">Updated during sessions — auto-refreshes</span>
      {/if}
    </div>

    {#if brainstorm && brainstorm.sections.length}
      <div class="bs-sections">
        {#each brainstorm.sections as section, i}
          <div class="bs-card">
            <div class="bs-card-head">
              <span class="bs-num">{(i + 1).toString().padStart(2, '0')}</span>
              <h3>{section.heading}</h3>
            </div>
            <div class="bs-body">
              {@html formatBody(section.body)}
            </div>
            <div class="bs-time">{new Date(section.timestamp).toLocaleString()}</div>
          </div>
        {/each}
      </div>
    {:else}
      <p class="bs-empty">
        No brainstorming yet. When we start a brainstorm session for this project, 
        ideas will appear here in real-time.
      </p>
    {/if}
  </section>
</div>

<style>
  .project-page {
    max-width: 800px;
    margin: 0 auto;
  }

  .back-link {
    display: inline-block;
    color: #888;
    font-size: 14px;
    text-decoration: none;
    margin-bottom: 20px;
    transition: color 0.15s;
  }

  .back-link:hover {
    color: #2d9cdb;
  }

  .project-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
  }

  .project-name {
    font-size: 28px;
    font-weight: 700;
    color: #e0e0e0;
    margin: 0 0 10px;
  }

  .project-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .status-badge {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;
  }

  .tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .tag {
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 4px;
    background: #1a1a34;
    color: #888;
    border: 1px solid #2a2a3e;
  }

  .created-date {
    font-size: 12px;
    color: #666;
  }

  .project-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 8px;
    background: #2d9cdb;
    color: #fff;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .project-link-btn:hover {
    background: #2488c2;
  }

  .section {
    background: #12122a;
    border: 1px solid #2a2a3e;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 10px;
  }

  .section-body {
    font-size: 15px;
    line-height: 1.7;
    color: #b0b0c0;
    margin: 0;
  }

  .abandon .section-title {
    color: #868e96;
  }

  .brainstorm {
    border-color: rgba(124, 58, 237, 0.2);
  }

  .brainstorm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .brainstorm-header .section-title {
    margin: 0;
    color: #a78bfa;
  }

  .update-note {
    font-size: 11px;
    color: #555;
  }

  .bs-sections {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .bs-card {
    background: #0d0d1a;
    border: 1px solid #1e1e30;
    border-radius: 8px;
    padding: 16px;
  }

  .bs-card-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .bs-num {
    font-size: 12px;
    font-weight: 700;
    color: #7c3aed;
    font-family: 'SF Mono', 'Fira Code', monospace;
    opacity: 0.6;
  }

  .bs-card-head h3 {
    font-size: 15px;
    font-weight: 600;
    color: #d0d0e0;
    margin: 0;
  }

  .bs-body {
    font-size: 14px;
    line-height: 1.7;
    color: #999;
  }

  .bs-body :global(p) { margin: 0 0 8px; }
  .bs-body :global(p:last-child) { margin-bottom: 0; }
  .bs-body :global(strong) { color: #b0b0c0; }
  .bs-body :global(code) {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 12px;
    background: #1a1a34;
    padding: 2px 6px;
    border-radius: 4px;
    color: #a78bfa;
  }
  .bs-body :global(br) { display: block; margin: 4px 0; }

  .bs-time {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid #1a1a2e;
    font-size: 11px;
    color: #555;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  .bs-empty {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    text-align: center;
    padding: 32px 0;
    margin: 0;
  }

  /* Mobile */
  @media (max-width: 768px) {
    .project-name {
      font-size: 22px;
    }

    .project-header {
      flex-direction: column;
    }

    .section {
      padding: 16px;
    }

    .project-link-btn {
      align-self: flex-start;
    }
  }
</style>