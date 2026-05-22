<script lang="ts">
  import { onMount } from 'svelte';

  let iframeLoaded = $state(false);

  onMount(() => {
    // Fix GoP links to work inside the iframe
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'gop-loaded') {
        iframeLoaded = true;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  });
</script>

<div class="gop-container">
  {#if !iframeLoaded}
    <div class="gop-loading">
      <div class="spinner"></div>
      <span>Loading Geography of Power...</span>
    </div>
  {/if}
  <iframe
    src="/go/index.html"
    class="gop-frame"
    class:loaded={iframeLoaded}
    title="Geography of Power"
    on:load={() => iframeLoaded = true}
    allow="fullscreen"
  />
</div>

<style>
  .gop-container {
    position: relative;
    width: 100%;
    height: calc(100vh - 64px);
    min-height: 600px;
    background: #0d0d1a;
  }

  .gop-frame {
    width: 100%;
    height: 100%;
    border: none;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .gop-frame.loaded {
    opacity: 1;
  }

  .gop-loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #666;
    font-size: 14px;
    z-index: 1;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #2a2a3e;
    border-top-color: #2d9cdb;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .gop-container {
      height: calc(100vh - 56px);
      min-height: 400px;
    }
  }
</style>
