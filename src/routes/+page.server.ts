import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadProjects, addProject, moveProject, editProject, deleteProject, getNextId } from '$lib/data';
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

    if (!name) {
      return fail(400, { error: 'Project name is required' });
    }

    try {
      const projects = await addProject({
        name,
        reason,
        notes,
        url: url || undefined,
        status: 'current',
      });
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

    if (!id || !name) {
      return fail(400, { error: 'Missing id or name' });
    }

    try {
      const projects = await editProject(id, { name, reason, notes, url: url || undefined });
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
  }
};
