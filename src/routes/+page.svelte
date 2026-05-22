<script lang="ts">
  import type { PageData } from './$types';
  import type { Project, ProjectStatus } from '$lib/types';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import AddModal from '$lib/AddModal.svelte';

  let { data }: { data: PageData } = $props();

  let projects = $state<Project[]>(data.projects);
  let showAdd = $state(false);
  let viewMode = $state<'kanban' | 'list'>('kanban');
  let editingProject = $state<Project | null>(null);

  const columns: { key: ProjectStatus; label: string; color: string }[] = [
    { key: 'current', label: 'Active', color: '#2d9cdb' },
    { key: 'deferred', label: 'Deferred', color: '#f2994a' },
    { key: 'abandoned', label: 'Abandoned', color: '#eb5757' }
  ];

  function handleMove(id: string, status: ProjectStatus, abandonReason?: string) {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    project.status = status;
    if (status === 'abandoned' && abandonReason) {
      project.abandonReason = abandonReason;
    }
    project.updatedAt = new Date().toISOString();
    submitMove(id, status, abandonReason).then(() => invalidateAll());
  }

  async function submitMove(id: string, status: ProjectStatus, abandonReason?: string) {
    const form = new FormData();
    form.set('id', id);
    form.set('status', status);
    if (abandonReason) form.set('abandonReason', abandonReason);
    await fetch('/?/move', { method: 'POST', body: form });
  }

  function openEdit(p: Project) {
    editingProject = p;
  }

  function openLink(url: string, e: MouseEvent) {
    e.stopPropagation();
    window.open(url, '_blank');
  }

  function handleEditResult(result: { success?: boolean; projects?: Project[] }) {
    if (result.success && result.projects) {
      projects = result.projects;
    }
    editingProject = null;
  }

  function handleAddResult(result: { success?: boolean; projects?: Project[]; error?: string }) {
    if (result.success && result.projects) {
      projects = result.projects;
      showAdd = false;
    }
  }

  function handleMoveResult(result: { success?: boolean; projects?: Project[] }) {
    if (result.success && result.projects) {
      projects = result.projects;
    }
  }

  function handleDeleteResult(result: { success?: boolean; projects?: Project[] }) {
    if (result.success && result.projects) {
      projects = result.projects;
    }
  }

  function getAbandonedCount(): number {
    return projects.filter(p => p.status === 'abandoned').length;
  }
</script>

<div class="app">
  <header>
    <h1>Project Organizer</h1>
    <div class="header-actions">
      <span class="count">{projects.length} projects</span>
      <div class="view-toggle">
        <button
          class="toggle-btn"
          class:active={viewMode === 'kanban'}
          onclick={() => viewMode = 'kanban'}
        >Kanban</button>
        <button
          class="toggle-btn"
          class:active={viewMode === 'list'}
          onclick={() => viewMode = 'list'}
        >List</button>
      </div>
      <button class="add-btn" onclick={() => showAdd = true}>+ New Project</button>
    </div>
  </header>

  <main>
    {#if viewMode === 'kanban'}
      <div class="kanban">
        {#each columns as col}
          <div class="column" data-status={col.key}>
            <div class="column-header" style="border-top: 3px solid {col.color}">
              <h2>{col.label}</h2>
              <span class="col-count">{projects.filter(p => p.status === col.key).length}</span>
            </div>
            <div
              class="column-body"
              ondragover={(e) => e.preventDefault()}
              ondrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer?.getData('text/plain');
                if (id && col.key !== 'abandoned') {
                  handleMove(id, col.key);
                } else if (id && col.key === 'abandoned') {
                  const reason = prompt('Why was this project abandoned?');
                  handleMove(id, col.key, reason || 'No reason given');
                }
              }}
            >
              {#each projects.filter(p => p.status === col.key) as project (project.id)}
                <div
                  class="card"
                  draggable="true"
                  ondragstart={(e) => {
                    e.dataTransfer?.setData('text/plain', project.id);
                  }}
                  onclick={() => openEdit(project)}
                >
                  <div class="card-top">
                    <strong>{project.name}</strong>
                    {#if project.url}
                      <button
                        class="open-link"
                        onclick={(e) => openLink(project.url!, e)}
                        title="Open {project.name}"
                      >↗</button>
                    {/if}
                  </div>
                  {#if project.reason}
                    <p class="reason">{project.reason}</p>
                  {/if}
                  {#if project.status === 'abandoned' && project.abandonReason}
                    <p class="abandon-reason">✕ {project.abandonReason}</p>
                  {/if}
                  <span class="date">{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="list-view">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Link</th>
              <th>Why</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {#each projects as project (project.id)}
              <tr onclick={() => openEdit(project)}>
                <td><strong>{project.name}</strong></td>
                <td>
                  {#if project.url}
                    <a href={project.url} target="_blank" class="table-link" onclick={(e) => e.stopPropagation()}>↗</a>
                  {/if}
                </td>
                <td class="reason-cell">{project.reason}</td>
                <td>
                  <span class="status-badge" data-status={project.status}>
                    {columns.find(c => c.key === project.status)?.label}
                  </span>
                </td>
                <td class="date-cell">{new Date(project.createdAt).toLocaleDateString()}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </main>
</div>

<!-- Add Project Modal -->
{#if showAdd}
  <AddModal
    onclose={() => showAdd = false}
    onresult={handleAddResult}
  />
{/if}

<!-- Edit Project Modal -->
{#if editingProject}
  <div class="modal-overlay" onclick={() => editingProject = null}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Edit Project</h2>
        <button class="close-btn" onclick={() => editingProject = null}>✕</button>
      </div>
      <form
        method="POST"
        action="/?/edit"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === 'success') {
              const data = result.data as { success?: boolean; projects?: Project[] };
              handleEditResult(data);
            }
          };
        }}
      >
        <input type="hidden" name="id" value={editingProject.id} />
        <label>
          Project Name
          <input type="text" name="name" value={editingProject.name} required />
        </label>
        <label>
          URL
          <input type="text" name="url" value={editingProject.url || ''} placeholder="http://localhost:5173" />
        </label>
        <label>
          Why I Care About This
          <textarea name="reason" rows="2">{editingProject.reason}</textarea>
        </label>
        <label>
          Notes
          <textarea name="notes" rows="3">{editingProject.notes}</textarea>
        </label>
        <div class="modal-actions">
          <button type="submit" class="btn-primary">Save</button>
          <button
            type="submit"
            formaction="/?/delete"
            formmethod="POST"
            class="btn-danger"
            onclick={(e) => {
              if (!confirm('Delete this project?')) e.preventDefault();
            }}
          >Delete</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 12px;
  }

  @media (max-width: 768px) {
    header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 20px;
    }

    .header-actions {
      width: 100%;
      flex-wrap: wrap;
    }

    .add-btn {
      flex: 1;
      text-align: center;
    }
  }

  h1 {
    margin: 0;
    font-size: 24px;
    color: #e0e0e0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .count {
    color: #888;
    font-size: 14px;
  }

  .view-toggle {
    display: flex;
    border: 1px solid #333;
    border-radius: 6px;
    overflow: hidden;
  }

  .toggle-btn {
    background: none;
    border: none;
    padding: 6px 14px;
    color: #888;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s;
  }

  .toggle-btn.active {
    background: #2d9cdb;
    color: #fff;
  }

  .add-btn {
    background: #2d9cdb;
    color: #fff;
    border: none;
    padding: 8px 18px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
  }

  .add-btn:hover {
    background: #2488c3;
  }

  .kanban {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    min-height: 60vh;
  }

  @media (max-width: 900px) {
    .kanban {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  @media (max-width: 480px) {
    .kanban {
      gap: 12px;
    }
  }

  .column {
    background: #1a1a2e;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .column-header {
    padding: 14px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #16162a;
  }

  .column-header h2 {
    margin: 0;
    font-size: 15px;
    color: #ccc;
    font-weight: 600;
  }

  .col-count {
    background: #2a2a3e;
    color: #888;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
  }

  .column-body {
    padding: 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 200px;
  }

  .card {
    background: #22223a;
    border-radius: 8px;
    padding: 12px 14px;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid transparent;
  }

  .card:hover {
    background: #2a2a44;
    border-color: #333;
  }

  .card:active {
    transform: scale(0.98);
  }

  @media (max-width: 768px) {
    .card {
      padding: 14px 16px;
    }

    .card-top strong {
      font-size: 15px;
    }
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .card-top strong {
    color: #e0e0e0;
    font-size: 14px;
  }

  .open-link {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid #333;
    background: #2a2a44;
    color: #2d9cdb;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    line-height: 1;
    padding: 0;
  }

  .open-link:hover {
    background: #2d9cdb;
    color: #fff;
    border-color: #2d9cdb;
  }

  .reason {
    color: #888;
    font-size: 12px;
    margin: 4px 0 0;
    line-height: 1.4;
  }

  .abandon-reason {
    color: #eb5757;
    font-size: 12px;
    margin: 4px 0 0;
    font-style: italic;
  }

  .date {
    color: #555;
    font-size: 11px;
    display: block;
    margin-top: 6px;
  }

  /* List View */
  .list-view {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .list-view table {
    width: 100%;
    border-collapse: collapse;
  }

  .list-view th {
    text-align: left;
    padding: 12px 16px;
    color: #888;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #2a2a3e;
  }

  .list-view td {
    padding: 12px 16px;
    border-bottom: 1px solid #1e1e32;
    color: #ccc;
    font-size: 14px;
  }

  .list-view tr {
    cursor: pointer;
    transition: background 0.1s;
  }

  .list-view tr:hover {
    background: #1a1a30;
  }

  .reason-cell {
    color: #888;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .date-cell {
    color: #666;
    font-size: 13px;
  }

  .table-link {
    color: #2d9cdb;
    text-decoration: none;
    font-size: 16px;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .table-link:hover {
    background: rgba(45, 156, 219, 0.15);
  }

  .status-badge {
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .status-badge[data-status="current"] {
    background: rgba(45, 156, 219, 0.15);
    color: #2d9cdb;
  }

  .status-badge[data-status="deferred"] {
    background: rgba(242, 153, 74, 0.15);
    color: #f2994a;
  }

  .status-badge[data-status="abandoned"] {
    background: rgba(235, 87, 87, 0.15);
    color: #eb5757;
  }

  /* Modal */
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
    max-height: 90vh;
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
  }

  .close-btn:hover {
    color: #fff;
  }

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

  textarea {
    resize: vertical;
  }

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

  .btn-primary:hover {
    background: #2488c3;
  }

  .btn-danger {
    background: transparent;
    color: #eb5757;
    border: 1px solid #eb5757;
    padding: 10px 22px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .btn-danger:hover {
    background: rgba(235, 87, 87, 0.1);
  }
</style>
