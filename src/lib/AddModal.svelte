<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Project, ProjectStatus } from '$lib/types';
  import { COLUMNS } from '$lib/types';

  let { onclose, onresult }: {
    onclose: () => void;
    onresult: (result: { success?: boolean; projects?: Project[]; error?: string }) => void;
  } = $props();

  let defaultStatus: ProjectStatus = 'idea';
</script>

<div class="modal-overlay" onclick={onclose}>
  <div class="modal" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <h2>New Project</h2>
      <button class="close-btn" onclick={onclose}>✕</button>
    </div>
    <form
      method="POST"
      action="/?/add"
      use:enhance={() => {
        return async ({ result, update }) => {
          await update();
          if (result.type === 'success') {
            const data = result.data as { success?: boolean; projects?: Project[]; error?: string };
            onresult(data);
          }
        };
      }}
    >
      <label>
        Project Name
        <input type="text" name="name" placeholder="What's the idea?" required />
      </label>
      <label>
        URL (optional)
        <input type="text" name="url" placeholder="https://..." />
      </label>
      <label>
        Tags (comma-separated)
        <input type="text" name="tags" placeholder="civic-tech, svelte, ..." />
      </label>
      <label>
        Why I Care
        <textarea name="reason" rows="2" placeholder="What makes this worth doing?"></textarea>
      </label>
      <label>
        Notes
        <textarea name="notes" rows="3" placeholder="Any quick thoughts, links, or context..."></textarea>
      </label>
      <label>
        Status
        <select name="status" bind:value={defaultStatus}>
          {#each COLUMNS as col}
            <option value={col.key}>{col.icon} {col.label} — {col.description}</option>
          {/each}
        </select>
      </label>
      <div class="modal-actions">
        <button type="button" class="btn-cancel" onclick={onclose}>Cancel</button>
        <button type="submit" class="btn-primary">Add Project</button>
      </div>
    </form>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }

  .modal {
    background: #12122a;
    border-radius: 12px;
    padding: 28px;
    width: 90%;
    max-width: 480px;
    border: 1px solid #2a2a3e;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .modal-header h2 {
    margin: 0;
    color: #e0e0e0;
    font-size: 18px;
  }

  .close-btn {
    background: none;
    border: none;
    color: #666;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
  }

  .close-btn:hover { color: #fff; }

  label {
    display: block;
    color: #888;
    font-size: 12px;
    margin-bottom: 14px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input[type="text"], textarea, select {
    width: 100%;
    margin-top: 6px;
    padding: 10px 12px;
    background: #0d0d1a;
    border: 1px solid #2a2a3e;
    border-radius: 6px;
    color: #e0e0e0;
    font-size: 14px;
    box-sizing: border-box;
    font-family: inherit;
  }

  textarea { resize: vertical; }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #2d9cdb;
  }

  select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 8px;
  }

  .btn-primary {
    background: #40c057;
    color: #fff;
    border: none;
    padding: 10px 22px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
  }

  .btn-primary:hover { background: #37b24d; }

  .btn-cancel {
    background: transparent;
    color: #888;
    border: 1px solid #333;
    padding: 10px 22px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .btn-cancel:hover {
    background: #1a1a2e;
    color: #ccc;
  }
</style>
