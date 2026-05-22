import pg from 'pg';
import type { Project, ProjectStatus } from '$lib/types';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://project_user:pRojects2026!@project-db:5432/project_organizer',
  max: 10,
  idleTimeoutMillis: 30000,
});

function rowToProject(row: any): Project {
  return {
    id: String(row.id),
    name: row.name,
    reason: row.reason || '',
    notes: row.notes || '',
    url: row.url || undefined,
    status: row.status as ProjectStatus,
    abandonReason: row.abandon_reason || undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function loadProjects(): Promise<Project[]> {
  const result = await pool.query(
    'SELECT * FROM projects ORDER BY created_at DESC'
  );
  return result.rows.map(rowToProject);
}

export async function saveProjects(projects: Project[]): Promise<void> {
  // Full replace: delete all and re-insert
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM projects');
    for (const p of projects) {
      await client.query(
        `INSERT INTO projects (id, name, reason, notes, url, status, abandon_reason, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           reason = EXCLUDED.reason,
           notes = EXCLUDED.notes,
           url = EXCLUDED.url,
           status = EXCLUDED.status,
           abandon_reason = EXCLUDED.abandon_reason,
           updated_at = EXCLUDED.updated_at`,
        [p.id, p.name, p.reason, p.notes, p.url || null, p.status, p.abandonReason || null, p.createdAt, p.updatedAt]
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

export async function getNextId(projects: Project[]): Promise<string> {
  const result = await pool.query('SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM projects');
  return String(result.rows[0].next_id);
}

export async function addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project[]> {
  const id = await getNextId([]);
  const now = new Date().toISOString();
  const newProject: Project = {
    ...project,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await pool.query(
    `INSERT INTO projects (id, name, reason, notes, url, status, abandon_reason, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, newProject.name, newProject.reason, newProject.notes, newProject.url || null, newProject.status, newProject.abandonReason || null, now, now]
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

export async function editProject(id: string, updates: { name: string; reason: string; notes: string; url?: string }): Promise<Project[]> {
  const now = new Date().toISOString();
  await pool.query(
    `UPDATE projects SET name = $1, reason = $2, notes = $3, url = $4, updated_at = $5 WHERE id = $6`,
    [updates.name, updates.reason, updates.notes, updates.url || null, now, id]
  );
  return loadProjects();
}

export async function deleteProject(id: string): Promise<Project[]> {
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
  return loadProjects();
}
