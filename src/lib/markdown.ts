import type { Project, ProjectStatus } from '$lib/types';

/**
 * Parse projects from markdown format:
 * 
 * ## Status: Running
 * 
 * ### Project Name
 * - **URL:** https://example.com
- **Tags:** tag1, tag2
 * - **Why:** Reason for this project
 * - **Notes:** Free-form notes
 * 
 * ---
 */
export function parseProjectsMarkdown(md: string): Project[] {
  const projects: Project[] = [];
  const now = new Date().toISOString();

  // Split into status sections
  const statusSections = md.split(/^## Status:\s*/m).filter(Boolean);

  for (const section of statusSections) {
    const lines = section.split('\n');
    const statusLine = lines[0]?.trim().toLowerCase();
    const status = normalizeStatus(statusLine);
    if (!status) continue;

    // Split into project blocks by ### headers
    const projectBlocks = section.split(/^###\s+/m).filter((b, i) => i > 0);

    for (const block of projectBlocks) {
      const blockLines = block.split('\n');
      const name = blockLines[0]?.trim();
      if (!name) continue;

      const rest = block.slice(blockLines[0].length + 1).join('\n');
      const url = extractField(rest, 'url');
      const tagsStr = extractField(rest, 'tags');
      const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
      const reason = extractField(rest, 'why');
      const notes = extractField(rest, 'notes');

      projects.push({
        id: `md-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        reason: reason || '',
        notes: notes || '',
        url: url || undefined,
        tags,
        status,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return projects;
}

function normalizeStatus(raw: string | undefined): ProjectStatus | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (s.includes('running') || s.includes('live') || s.includes('deployed')) return 'running';
  if (s.includes('progress') || s.includes('building') || s.includes('working')) return 'in-progress';
  if (s.includes('idea') || s.includes('concept') || s.includes('backlog')) return 'idea';
  if (s.includes('defer') || s.includes('pause') || s.includes('later')) return 'deferred';
  if (s.includes('abandon') || s.includes('kill') || s.includes('drop')) return 'abandoned';
  return null;
}

function extractField(text: string, field: string): string {
  const regex = new RegExp(`[*_]*${field}[:*_]*\\s*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match?.[1]?.trim() || '';
}

/**
 * Serialize projects back to markdown
 */
export function projectsToMarkdown(projects: Project[]): string {
  const byStatus: Record<string, Project[]> = {};
  for (const p of projects) {
    if (!byStatus[p.status]) byStatus[p.status] = [];
    byStatus[p.status].push(p);
  }

  const statusLabels: Record<ProjectStatus, string> = {
    running: 'Running',
    'in-progress': 'In Progress',
    idea: 'Ideas',
    deferred: 'Deferred',
    abandoned: 'Abandoned',
  };

  let md = '# Project Organizer\n\n';
  md += '> Edit this file to add, remove, or change projects. The app reads this on load.\n';
  md += '> Status sections: Running, In Progress, Ideas, Deferred, Abandoned\n\n';
  md += '---\n\n';

  const order: ProjectStatus[] = ['running', 'in-progress', 'idea', 'deferred', 'abandoned'];
  for (const status of order) {
    const projs = byStatus[status];
    if (!projs || projs.length === 0) continue;

    md += `## Status: ${statusLabels[status]}\n\n`;
    for (const p of projs) {
      md += `### ${p.name}\n`;
      if (p.url) md += `- **URL:** ${p.url}\n`;
      if (p.tags.length) md += `- **Tags:** ${p.tags.join(', ')}\n`;
      if (p.reason) md += `- **Why:** ${p.reason}\n`;
      if (p.notes) md += `- **Notes:** ${p.notes}\n`;
      md += '\n---\n\n';
    }
  }

  return md;
}
