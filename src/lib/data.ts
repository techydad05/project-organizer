import initSqlJs, { type Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import type { Project, ProjectStatus } from '$lib/types';
import { parseProjectsMarkdown, projectsToMarkdown } from '$lib/markdown';

const DATA_DIR = process.env.DATA_DIR || '/app/data';
const DB_PATH = path.join(DATA_DIR, 'projects.db');
const MARKDOWN_FILE = process.env.MARKDOWN_FILE || 'projects.md';
const MARKDOWN_PATH = path.join(DATA_DIR, MARKDOWN_FILE);

let db: Database;
let SQL: Awaited<ReturnType<typeof initSqlJs>>;

async function getDb(): Promise<Database> {
  if (db) return db;

  SQL = await initSqlJs();
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
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

  saveToFile();
  return db;
}

function saveToFile() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function rowToProject(row: any[]): Project {
  return {
    id: row[0],
    name: row[1] || '',
    reason: row[2] || '',
    notes: row[3] || '',
    url: row[4] || undefined,
    tags: row[5] ? JSON.parse(row[5]) : [],
    status: (row[6] || 'idea') as ProjectStatus,
    abandonReason: row[7] || undefined,
    createdAt: row[8],
    updatedAt: row[9],
  };
}

export async function loadProjects(): Promise<Project[]> {
  const db = await getDb();
  const result = db.exec('SELECT * FROM projects ORDER BY created_at DESC');
  if (!result.length || !result[0].values.length) return [];
  return result[0].values.map(row => rowToProject(row));
}

export async function saveProjects(projects: Project[]): Promise<void> {
  const db = await getDb();
  db.run('DELETE FROM projects');
  for (const p of projects) {
    db.run(
      'INSERT OR REPLACE INTO projects (id, name, reason, notes, url, tags, status, abandon_reason, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [p.id, p.name, p.reason, p.notes, p.url || null, JSON.stringify(p.tags), p.status, p.abandonReason || null, p.createdAt, p.updatedAt]
    );
  }
  saveToFile();
}

export async function getNextId(): Promise<string> {
  const db = await getDb();
  const result = db.exec('SELECT COUNT(*) FROM projects');
  const count = result[0]?.values?.[0]?.[0] || 0;
  return String(Number(count) + 1);
}

export async function addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project[]> {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = await getNextId();
  db.run(
    'INSERT INTO projects (id, name, reason, notes, url, tags, status, abandon_reason, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [id, project.name, project.reason, project.notes, project.url || null, JSON.stringify(project.tags), project.status, project.abandonReason || null, now, now]
  );
  saveToFile();
  return loadProjects();
}

export async function moveProject(id: string, status: ProjectStatus, abandonReason?: string): Promise<Project[]> {
  const db = await getDb();
  const now = new Date().toISOString();
  db.run('UPDATE projects SET status = ?, abandon_reason = ?, updated_at = ? WHERE id = ?', [status, abandonReason || null, now, id]);
  saveToFile();
  return loadProjects();
}

export async function editProject(id: string, updates: { name: string; reason: string; notes: string; url?: string; tags?: string[] }): Promise<Project[]> {
  const db = await getDb();
  const now = new Date().toISOString();
  db.run('UPDATE projects SET name = ?, reason = ?, notes = ?, url = ?, tags = ?, updated_at = ? WHERE id = ?', [updates.name, updates.reason, updates.notes, updates.url || null, JSON.stringify(updates.tags || []), now, id]);
  saveToFile();
  return loadProjects();
}

export async function deleteProject(id: string): Promise<Project[]> {
  const db = await getDb();
  db.run('DELETE FROM projects WHERE id = ?', [id]);
  saveToFile();
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
