import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadProjects, addProject, moveProject, editProject, deleteProject, importFromMarkdown, exportToMarkdown } from '$lib/data';
import type { Project, ProjectStatus } from '$lib/types';

export const load: PageServerLoad = async () => {
  const projects = await loadProjects();
  return { projects };
};

export const actions: Actions = {
  add: async ({ request }) => {
    const form = await request.formData();
    const name = form.get('name')?.toString().trim();
    const reason = form.get('reason')?.toString().trim() || '';
    const notes = form.get('notes')?.toString().trim() || '';
    const url = form.get('url')?.toString().trim() || '';
    const tagsStr = form.get('tags')?.toString().trim() || '';
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const status = (form.get('status')?.toString() || 'idea') as ProjectStatus;

    if (!name) {
      return fail(400, { error: 'Project name is required' });
    }

    try {
      const projects = await addProject({ name, reason, notes, url: url || undefined, tags, status });
      return { success: true, projects };
    } catch (e) {
      return fail(500, { error: 'Failed to add project' });
    }
  },

  move: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id')?.toString();
    const status = form.get('status')?.toString() as ProjectStatus;
    const abandonReason = form.get('abandonReason')?.toString().trim() || '';

    if (!id || !status) {
      return fail(400, { error: 'Missing id or status' });
    }

    try {
      const projects = await moveProject(id, status, abandonReason || undefined);
      return { success: true, projects };
    } catch (e) {
      return fail(500, { error: 'Failed to move project' });
    }
  },

  edit: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id')?.toString();
    const name = form.get('name')?.toString().trim();
    const reason = form.get('reason')?.toString().trim() || '';
    const notes = form.get('notes')?.toString().trim() || '';
    const url = form.get('url')?.toString().trim() || '';
    const tagsStr = form.get('tags')?.toString().trim() || '';
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    if (!id || !name) {
      return fail(400, { error: 'Missing id or name' });
    }

    try {
      const projects = await editProject(id, { name, reason, notes, url: url || undefined, tags });
      return { success: true, projects };
    } catch (e) {
      return fail(500, { error: 'Failed to edit project' });
    }
  },

  delete: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id')?.toString();

    if (!id) {
      return fail(400, { error: 'Missing id' });
    }

    try {
      const projects = await deleteProject(id);
      return { success: true, projects };
    } catch (e) {
      return fail(500, { error: 'Failed to delete project' });
    }
  },

  importMd: async () => {
    try {
      const projects = await importFromMarkdown();
      return { success: true, projects, message: `Imported ${projects.length} projects from markdown` };
    } catch (e) {
      return fail(500, { error: 'Failed to import from markdown' });
    }
  },

  exportMd: async ({ request }) => {
    try {
      const form = await request.formData();
      const projectsJson = form.get('projects')?.toString();
      if (!projectsJson) return fail(400, { error: 'No projects data' });
      const projects: Project[] = JSON.parse(projectsJson);
      const md = await exportToMarkdown(projects);
      return { success: true, message: 'Exported to markdown', markdown: md };
    } catch (e) {
      return fail(500, { error: 'Failed to export to markdown' });
    }
  },
};
