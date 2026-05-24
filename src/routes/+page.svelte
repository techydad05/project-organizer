<script lang="ts">
  import type { PageData } from './$types';
  import type { Project, ProjectStatus } from '$lib/types';
  import { COLUMNS } from '$lib/types';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import AddModal from '$lib/AddModal.svelte';

  let { data }: { data: PageData } = $props();

  let projects = $state<Project[]>(data.projects);
  let showAdd = $state(false);
  let viewMode = $state<'kanban' | 'list'>('kanban');
  let editingProject = $state<Project | null>(null);
  let searchQuery = $state('');
  let showAbandoned = $state(true);
  let mdImportStatus = $state<string | null>(null);

  // Filtered projects
  let filteredProjects = $derived(() => {
    let result = projects;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.reason.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  });

  function projectsForColumn(colKey: ProjectStatus): Project[] {
    return filteredProjects().filter(p => p.status === colKey);
  }

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
    editingProject = { ...p };
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

  async function handleImportMarkdown() {
    mdImportStatus = 'Importing...';
    const form = new FormData();
    const result = await fetch('/?/importMd', { method: 'POST', body: form });
    const json = await result.json();
    if (json.success && json.projects) {
      projects = json.projects;
      mdImportStatus = json.message || 'Imported!';
    } else {
      mdImportStatus = json.error || 'Import failed';
    }
    setTimeout(() => mdImportStatus = null, 3000);
  }

  function getColumnCount(colKey: ProjectStatus): number {
    return projects.filter(p => p.status === colKey).length;
  }

  function getTotalCount(): number {
    return projects.length;
  }
</script>

<div class="app">
  <header>
    <div class="header-left">
      <h1>◇ Project Organizer</h1>
      <span class="total-count">{getTotalCount()} projects</span>
    </div>
    <div class="header-actions">
      <div class="search-wrap">
        <input
          type="text"
          class="search-input"
          placeholder="Search projects..."
          bind:value={searchQuery}
        />
      </div>
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
      <button class="import-btn" onclick={handleImportMarkdown} title="Import from projects.md">
        📄 Import .md
      </button>
      {#if mdImportStatus}
        <span class="import-status">{mdImportStatus}</span>
      {/if}
      <button class="add-btn" onclick={() => showAdd = true}>+ New</button>
    </div>
  </header>

  <main>
    {#if viewMode === 'kanban'}
      <div class="kanban">
        {#each COLUMNS as col}
          {#if col.key !== 'abandoned' || showAbandoned}
            <div class="column" data-status={col.key}>
              <div class="column-header" style="border-top: 3px solid {col.color}">
                <div class="col-title">
                  <span class="col-icon">{col.icon}</span>
                  <h2>{col.label}</h2>
                </div>
                <span class="col-count">{projectsForColumn(col.key).length}</span>
              </div>
              <div class="col-desc">{col.description}</div>
              <div
                class="column-body"
                ondragover={(e) => e.preventDefault()}
                ondrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer?.getData('text/plain');
                  if (!id) return;
                  if (col.key === 'abandoned') {
                    const reason = prompt('Why was this project abandoned?');
                    handleMove(id, col.key, reason || 'No reason given');
                  } else {
                    handleMove(id, col.key);
                  }
                }}
              >
                {#each projectsForColumn(col.key) as project (project.id)}
                  <div
                    class="card"
                    style="border-left: 3px solid {col.color}"
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
                          title="Open"
                        >↗</button>
                      {/if}
                    </div>
                    {#if project.reason}
                      <p class="reason">{project.reason}</p>
                    {/if}
                    {#if project.tags.length}
                      <div class="tags">
                        {#each project.tags as tag}
                          <span class="tag">{tag}</span>
                        {/each}
                      </div>
                    {/if}
                    {#if project.notes}
                      <p class="notes-preview">{project.notes.slice(0, 120)}{project.notes.length > 120 ? '...' : ''}</p>
                    {/if}
                    {#if project.status === 'abandoned' && project.abandonReason}
                      <p class="abandon-reason">✕ {project.abandonReason}</p>
                    {/if}
                    <span class="date">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                {/each}
                {#if projectsForColumn(col.key).length === 0}
                  <div class="empty-col">
                    <span class="empty-icon">{col.icon}</span>
                    <span>Drop here or add new</span>
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <div class="list-view">
        <div class="list-controls">
          <label class="toggle-abandoned">
            <input type="checkbox" bind:checked={showAbandoned} />
            Show Abandoned ({getColumnCount('abandoned')})
          </label>
        </div>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Status</th>
              <th>Tags</th>
              <th>Why</th>
              <th>Link</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {#each COLUMNS.filter(c => c.key !== 'abandoned' || showAbandoned) as col}
              {#each projectsForColumn(col.key) as project (project.id)}
                <tr onclick={() => openEdit(project)} class="status-row" data-status={col.key}>
                  <td>
                    <strong>{project.name}</strong>
                    {#if project.notes}
                      <p class="row-notes">{project.notes.slice(0, 80)}{project.notes.length > 80 ? '...' : ''}</p>
                    {/if}
                  </td>
                  <td>
                    <span class="status-badge" style="background: {col.color}22; color: {col.color}; border: 1px solid {col.color}44">
                      {col.icon} {col.label}
                    </span>
                  </td>
                  <td>
                    {#each project.tags as tag}
                      <span class="tag">{tag}</span>
                    {/each}
                  </td>
                  <td class="reason-cell">{project.reason}</td>
                  <td>
                    {#if project.url}
                      <a href={project.url} target="_blank" class="table-link" onclick={(e) => e.stopPropagation()}>↗</a>
                    {/if}
                  </td>
                  <td class="date-cell">{new Date(project.updatedAt).toLocaleDateString()}</td>
                </tr>
              {/each}
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
          <input type="text" name="url" value={editingProject.url || ''} placeholder="https://..." />
        </label>
        <label>
          Tags (comma-separated)
          <input type="text" name="tags" value={editingProject.tags.join(', ')} placeholder="civic-tech, svelte, ..." />
        </label>
        <label>
          Why I Care
          <textarea name="reason" rows="2">{editingProject.reason}</textarea>
        </label>
        <label>
          Notes
          <textarea name="notes" rows="3">{editingProject.notes}</textarea>
        </label>
        <label>
          Status
          <select name="status">
            {#each COLUMNS as col}
              <option value={col.key} selected={editingProject.status === col.key}>
                {col.icon} {col.label}
              </option>
            {/each}
          </select>
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
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  h1 {
    margin: 0;
    font-size: 22px;
    color: #e0e0e0;
  }

  .total-count {
    color: #666;
    font-size: 13px;
    background: #1a1a2e;
    padding: 4px 10px;
    border-radius: 12px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .search-wrap {
    position: relative;
  }

  .search-input {
    background: #12122a;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 8px 14px;
    color: #ccc;
    font-size: 13px;
    width: 180px;
    transition: all 0.15s;
  }

  .search-input:focus {
    outline: none;
    border-color: #2d9cdb;
    width: 220px;
  }

  .search-input::placeholder {
    color: #555;
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

  .import-btn {
    background: #1a1a2e;
    color: #aaa;
    border: 1px solid #333;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s;
  }

  .import-btn:hover {
    background: #22223a;
    color: #ccc;
    border-color: #444;
  }

  .import-status {
    color: #40c057;
    font-size: 12px;
    animation: fadeIn 0.3s;
  }

  .add-btn {
    background: #40c057;
    color: #fff;
    border: none;
    padding: 8px 18px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.15s;
  }

  .add-btn:hover {
    background: #37b24d;
  }

  /* Kanban */
  .kanban {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    min-height: 60vh;
  }

  .column {
    background: #12122a;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid #1e1e3a;
  }

  .column-header {
    padding: 12px 14px 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .col-title {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .col-icon {
    font-size: 14px;
  }

  .column-header h2 {
    margin: 0;
    font-size: 14px;
    color: #ccc;
    font-weight: 600;
  }

  .col-desc {
    padding: 0 14px 8px;
    font-size: 11px;
    color: #555;
  }

  .col-count {
    background: #1e1e3a;
    color: #888;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
  }

  .column-body {
    padding: 8px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 120px;
  }

  .empty-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 12px;
    color: #333;
    font-size: 12px;
    gap: 6px;
    border: 2px dashed #1e1e3a;
    border-radius: 8px;
    margin: 4px;
  }

  .empty-icon {
    font-size: 20px;
    opacity: 0.4;
  }

  .card {
    background: #1a1a2e;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid #1e1e3a;
  }

  .card:hover {
    background: #1e1e3a;
    border-color: #333;
    transform: translateY(-1px);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }

  .card-top strong {
    color: #e0e0e0;
    font-size: 13px;
    line-height: 1.3;
  }

  .open-link {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 1px solid #333;
    background: #22223a;
    color: #2d9cdb;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
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
    margin: 6px 0 0;
    line-height: 1.4;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
  }

  .tag {
    background: #1e1e3a;
    color: #74c0fc;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 500;
    border: 1px solid #2a2a44;
  }

  .notes-preview {
    color: #555;
    font-size: 11px;
    margin: 4px 0 0;
    line-height: 1.4;
  }

  .abandon-reason {
    color: #eb5757;
    font-size: 11px;
    margin: 4px 0 0;
    font-style: italic;
  }

  .date {
    color: #444;
    font-size: 10px;
    display: block;
    margin-top: 6px;
  }

  /* List View */
  .list-view {
    overflow-x: auto;
  }

  .list-controls {
    margin-bottom: 12px;
  }

  .toggle-abandoned {
    color: #888;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .toggle-abandoned input {
    accent-color: #2d9cdb;
  }

  .list-view table {
    width: 100%;
    border-collapse: collapse;
  }

  .list-view th {
    text-align: left;
    padding: 10px 14px;
    color: #666;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #1e1e3a;
  }

  .list-view td {
    padding: 12px 14px;
    border-bottom: 1px solid #1a1a2e;
    font-size: 13px;
    color: #ccc;
    vertical-align: top;
  }

  .list-view tr {
    cursor: pointer;
    transition: background 0.1s;
  }

  .list-view tr:hover td {
    background: #1a1a2e;
  }

  .row-notes {
    color: #555;
    font-size: 11px;
    margin: 4px 0 0;
  }

  .status-badge {
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  .reason-cell {
    max-width: 200px;
    color: #888;
  }

  .table-link {
    color: #2d9cdb;
    text-decoration: none;
    font-size: 16px;
  }

  .table-link:hover {
    color: #74c0fc;
  }

  .date-cell {
    color: #555;
    white-space: nowrap;
  }

  /* Modal */
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
    max-width: 500px;
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

  .btn-danger {
    background: transparent;
    color: #eb5757;
    border: 1px solid #eb575744;
    padding: 10px 22px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .btn-danger:hover {
    background: #eb575722;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Responsive */
  @media (max-width: 1200px) {
    .kanban {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 768px) {
    .kanban {
      grid-template-columns: 1fr;
    }

    header {
      flex-direction: column;
      align-items: flex-start;
    }

    .header-actions {
      width: 100%;
    }

    .search-input {
      width: 100%;
    }

    .search-input:focus {
      width: 100%;
    }
  }
</style>
