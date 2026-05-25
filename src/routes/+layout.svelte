<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';

  let { children } = $props();

  const navItems = [
    { href: '/', label: 'Projects', icon: '📋' },
    { href: '/brainstorm', label: 'Brainstorm', icon: '🧠' },
    { href: '/geography-of-power', label: 'Geo of Power', icon: '🗺️' },
    { href: '/stream-control', label: 'Stream', icon: '🎙️' },
  ];
</script>

<div class="layout">
  <nav class="navbar">
    <a href="/" class="brand">
      <span class="brand-icon">◇</span>
      <span class="brand-text">Project Organizer</span>
    </a>
    <div class="nav-links">
      {#each navItems as item}
        <a
          href={item.href}
          class="nav-link"
          class:active={$page.url.pathname === item.href}
        >
          <span class="nav-icon">{item.icon}</span>
          <span class="nav-label">{item.label}</span>
        </a>
      {/each}
    </div>
    <button class="menu-btn" aria-label="Menu" onclick={() => {
      document.querySelector('.nav-links')?.classList.toggle('open');
    }}>
      <span class="menu-bar"></span>
      <span class="menu-bar"></span>
      <span class="menu-bar"></span>
    </button>
  </nav>
  <main class="content">
    {#if $page.url.pathname === '/geography-of-power'}
      {@render children()}
    {:else}
      <div class="page-wrap">
        {@render children()}
      </div>
    {/if}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #0d0d1a;
    color: #ccc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 56px;
    background: #12122a;
    border-bottom: 1px solid #2a2a3e;
    position: sticky;
    top: 0;
    z-index: 50;
    gap: 16px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: #e0e0e0;
    flex-shrink: 0;
  }

  .brand-icon {
    font-size: 20px;
    color: #2d9cdb;
  }

  .brand-text {
    font-size: 16px;
    font-weight: 700;
    white-space: nowrap;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 8px;
    text-decoration: none;
    color: #888;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .nav-link:hover {
    background: #1a1a34;
    color: #ccc;
  }

  .nav-link.active {
    background: rgba(45, 156, 219, 0.12);
    color: #2d9cdb;
  }

  .nav-icon {
    font-size: 16px;
  }

  .nav-label {
    font-size: 14px;
  }

  .menu-btn {
    display: none;
    flex-direction: column;
    gap: 4px;
    background: none;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 8px;
    cursor: pointer;
  }

  .menu-bar {
    display: block;
    width: 20px;
    height: 2px;
    background: #888;
    border-radius: 2px;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .page-wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    width: 100%;
    box-sizing: border-box;
  }

  /* Mobile */
  @media (max-width: 768px) {
    .navbar {
      padding: 0 16px;
      height: 50px;
    }

    .brand-text {
      font-size: 14px;
    }

    .menu-btn {
      display: flex;
    }

    .nav-links {
      display: none;
      position: absolute;
      top: 50px;
      left: 0;
      right: 0;
      background: #12122a;
      border-bottom: 1px solid #2a2a3e;
      flex-direction: column;
      padding: 8px;
      gap: 2px;
    }

    .nav-links.open {
      display: flex;
    }

    .nav-link {
      width: 100%;
      padding: 10px 14px;
    }

    .page-wrap {
      padding: 16px;
    }
  }

  @media (max-width: 480px) {
    .page-wrap {
      padding: 12px;
    }
  }
</style>
