<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Project } from '$lib/types';

  let { onclose, onresult }: {
    onclose: () => void;
    onresult: (result: { success?: boolean; projects?: Project[]; error?: string }) => void;
  } = $props();
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
        <input type="text" name="url" placeholder="http://localhost:5173 or https://..." />
      </label>
      <label>
        Why I Care About This
        <textarea name="reason" rows="2" placeholder="What makes this worth doing?"></textarea>
      </label>
      <label>
        Notes
        <textarea name="notes" rows="3" placeholder="Any quick thoughts, links, or context..."></textarea>
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
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal {
    background: #1a1a2e;
    border-radius: 12px;
    padding: 28px;
    width: 90%;
    max-width: 480px;
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
  }

  .close-btn:hover { color: #fff; }

  label {
    display: block;
    color: #aaa;
    font-size: 13px;
    margin-bottom: 16px;
    font-weight: 500;
  }

  input[type="text"], textarea {
    width: 100%;
    margin-top: 6px;
    padding: 10px 12px;
    background: #12122a;
    border: 1px solid #333;
    border-radius: 6px;
    color: #e0e0e0;
    font-size: 14px;
    box-sizing: border-box;
    font-family: inherit;
  }

  textarea { resize: vertical; }

  input:focus, textarea:focus {
    outline: none;
    border-color: #2d9cdb;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 8px;
  }

  .btn-primary {
    background: #2d9cdb;
    color: #fff;
    border: none;
    padding: 10px 22px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
  }

  .btn-primary:hover { background: #2488c3; }

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
    background: #222;
    color: #ccc;
  }
</style>
