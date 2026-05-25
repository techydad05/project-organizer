import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import type { Project, ProjectStatus } from '$lib/types';
import { parseProjectsMarkdown, projectsToMarkdown } from '$lib/markdown';

const DATA_DIR = process.env.DATA_DIR || '/app/data';
const DB_PATH = path.join(DATA_DIR, 'projects.db');
const MARKDOWN_FILE = process.env.MARKDOWN_FILE || 'projects.md';
const MARKDOWN_PATH = path.join(DATA_DIR, MARKDOWN_FILE);

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        reason TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        url TEXT,
        tags TEXT DEFAULT '[]',
        status TEXT DEFAULT 'idea',
        abandon_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }
  return db;
}

function rowToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name || '',
    reason: row.reason || '',
    notes: row.notes || '',
    url: row.url || undefined,
    tags: row.tags ? JSON.parse(row.tags) : [],
    status: (row.status || 'idea') as ProjectStatus,
    abandonReason: row.abandon_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadProjects(): Promise<Project[]> {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  return rows.map(rowToProject);
}

export async function saveProjects(projects: Project[]): Promise<void> {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO projects (id, name, reason, notes, url, tags, status, abandon_reason, created_at, updated_at)
    VALUES (@id, @name, @reason, @notes, @url, @tags, @status, @abandonReason, @createdAt, @updatedAt)
  `);
  const del = db.prepare('DELETE FROM projects');
  const txn = db.transaction(() => {
    del.run();
    for (const p of projects) {
      insert.run({
        ...p,
        url: p.url || null,
        tags: JSON.stringify(p.tags),
        abandonReason: p.abandonReason || null,
      });
    }
  });
  txn();
}

export async function getNextId(): Promise<string> {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as cnt FROM projects').get() as any;
  return String((row?.cnt || 0) + 1);
}

export async function addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project[]> {
  const db = getDb();
  const now = new Date().toISOString();
  const id = await getNextId();
  db.prepare(`
    INSERT INTO projects (id, name, reason, notes, url, tags, status, abandon_reason, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, project.name, project.reason, project.notes, project.url || null, JSON.stringify(project.tags), project.status, project.abandonReason || null, now, now);
  return loadProjects();
}

export async function moveProject(id: string, status: ProjectStatus, abandonReason?: string): Promise<Project[]> {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE projects SET status = ?, abandon_reason = ?, updated_at = ? WHERE id = ?').run(status, abandonReason || null, now, id);
  return loadProjects();
}

export async function editProject(id: string, updates: { name: string; reason: string; notes: string; url?: string; tags?: string[] }): Promise<Project[]> {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE projects SET name = ?, reason = ?, notes = ?, url = ?, tags = ?, updated_at = ? WHERE id = ?').run(updates.name, updates.reason, updates.notes, updates.url || null, JSON.stringify(updates.tags || []), now, id);
  return loadProjects();
}

export async function deleteProject(id: string): Promise<Project[]> {
  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
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
