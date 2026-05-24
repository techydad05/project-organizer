import fs from 'fs';
import path from 'path';
import pg from 'pg';
import type { Project, ProjectStatus } from '$lib/types';
import { parseProjectsMarkdown, projectsToMarkdown } from '$lib/markdown';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://project_user:***@project-db:5432/project_organizer',
  max: 10,
  idleTimeoutMillis: 30000,
});

const DATA_DIR = process.env.DATA_DIR || '/app/data';
const MARKDOWN_FILE = process.env.MARKDOWN_FILE || 'projects.md';
const MARKDOWN_PATH = path.join(DATA_DIR, MARKDOWN_FILE);

// Ensure schema is up to date
export async function ensureSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    // Check if tags column exists
    const colCheck = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tags'`
    );
    if (colCheck.rows.length === 0) {
      await client.query('ALTER TABLE projects ADD COLUMN tags TEXT[] DEFAULT \'{}\'');
    }
    // Check if status values need migration (old -> new)
    await client.query(
      `UPDATE projects SET status = 'running' WHERE status = 'current'`
    );
    await client.query(
      `UPDATE projects SET status = 'in-progress' WHERE status = 'deferred' AND abandon_reason = ''`
    );
  } finally {
    client.release();
  }
}

function rowToProject(row: any): Project {
  return {
    id: String(row.id),
    name: row.name || '',
    reason: row.reason || '',
    notes: row.notes || '',
    url: row.url || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    status: (row.status || 'idea') as ProjectStatus,
    abandonReason: row.abandon_reason || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function loadProjects(): Promise<Project[]> {
  await ensureSchema();
  const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
  return result.rows.map(rowToProject);
}

export async function saveProjects(projects: Project[]): Promise<void> {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM projects');
    for (const p of projects) {
      await client.query(
        `INSERT INTO projects (id, name, reason, notes, url, tags, status, abandon_reason, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           reason = EXCLUDED.reason,
           notes = EXCLUDED.notes,
           url = EXCLUDED.url,
           tags = EXCLUDED.tags,
           status = EXCLUDED.status,
           abandon_reason = EXCLUDED.abandon_reason,
           updated_at = EXCLUDED.updated_at`,
        [p.id, p.name, p.reason, p.notes, p.url || null, p.tags, p.status, p.abandonReason || null, p.createdAt, p.updatedAt]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getNextId(): Promise<string> {
  const result = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM projects');
  return String(result.rows[0].next_id);
}

export async function addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project[]> {
  const id = await getNextId();
  const now = new Date().toISOString();
  const newProject: Project = {
    ...project,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await pool.query(
    `INSERT INTO projects (id, name, reason, notes, url, tags, status, abandon_reason, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, newProject.name, newProject.reason, newProject.notes, newProject.url || null, newProject.tags, newProject.status, newProject.abandonReason || null, now, now]
  );
  return loadProjects();
}

export async function moveProject(id: string, status: ProjectStatus, abandonReason?: string): Promise<Project[]> {
  const now = new Date().toISOString();
  await pool.query(
    `UPDATE projects SET status = $1, abandon_reason = $2, updated_at = $3 WHERE id = $4`,
    [status, abandonReason || '', now, id]
  );
  return loadProjects();
}

export async function editProject(id: string, updates: { name: string; reason: string; notes: string; url?: string; tags?: string[] }): Promise<Project[]> {
  const now = new Date().toISOString();
  await pool.query(
    `UPDATE projects SET name = $1, reason = $2, notes = $3, url = $4, tags = $5, updated_at = $6 WHERE id = $7`,
    [updates.name, updates.reason, updates.notes, updates.url || null, updates.tags || [], now, id]
  );
  return loadProjects();
}

export async function deleteProject(id: string): Promise<Project[]> {
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
  return loadProjects();
}

// --- Markdown file operations ---

export function getMarkdownPath(): string {
  return MARKDOWN_PATH;
}

export async function loadProjectsFromMarkdown(): Promise<{ projects: Project[]; raw: string; path: string }> {
  try {
    const raw = fs.readFileSync(MARKDOWN_PATH, 'utf-8');
    const projects = parseProjectsMarkdown(raw);
    return { projects, raw, path: MARKDOWN_PATH };
  } catch (e) {
    return { projects: [], raw: '', path: MARKDOWN_PATH };
  }
}

export async function importFromMarkdown(): Promise<Project[]> {
  const { projects } = await loadProjectsFromMarkdown();
  if (projects.length > 0) {
    await saveProjects(projects);
  }
  return loadProjects();
}

export async function exportToMarkdown(projects: Project[]): Promise<string> {
  const md = projectsToMarkdown(projects);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(MARKDOWN_PATH, md, 'utf-8');
  return md;
}
