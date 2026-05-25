import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getProjectBySlug, slugify } from '$lib/data';
import { COLUMNS } from '$lib/types';
import fs from 'fs';
import path from 'path';

export const load: PageServerLoad = async ({ params }) => {
  const project = await getProjectBySlug(params.slug);

  if (!project) {
    throw error(404, 'Project not found');
  }

  const col = COLUMNS.find(c => c.key === project.status);
  const statusInfo = col ? { label: col.label, color: col.color, icon: col.icon } : { label: project.status, color: '#868e96', icon: '○' };

  // Load brainstorming data from static file
  const brainstormPath = path.resolve('static', 'brainstorm', `${params.slug}.json`);
  let brainstorm: { sections: Array<{ heading: string; body: string; timestamp: string }> } | null = null;
  
  if (fs.existsSync(brainstormPath)) {
    try {
      const raw = fs.readFileSync(brainstormPath, 'utf-8');
      brainstorm = JSON.parse(raw);
    } catch (e) {
      // Ignore parse errors, just return null
    }
  }

  return {
    project,
    slug: params.slug,
    statusInfo,
    brainstorm
  };
};