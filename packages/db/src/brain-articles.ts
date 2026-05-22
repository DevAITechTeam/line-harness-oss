import { jstNow } from './utils.js';

export interface BrainArticle {
  id: string;
  title: string;
  body: string;
  price: number;
  category: string;
  thumbnail_prompt: string | null;
  seed_source: string | null;
  composition_status: 'pending' | 'ready' | 'failed';
  brain_status: 'pending' | 'draft_saved' | 'under_review' | 'published' | 'failed';
  brain_url: string | null;
  image_status: 'none' | 'inserted' | 'failed' | null;
  thumbnail_status: 'none' | 'done' | 'failed' | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBrainArticleInput {
  id: string;
  title: string;
  body: string;
  price?: number;
  category?: string;
  thumbnail_prompt?: string | null;
  seed_source?: string | null;
  composition_status?: 'pending' | 'ready' | 'failed';
  brain_status?: 'pending' | 'draft_saved' | 'under_review' | 'published' | 'failed';
  brain_url?: string | null;
  image_status?: 'none' | 'inserted' | 'failed';
  thumbnail_status?: 'none' | 'done' | 'failed';
}

export async function getBrainArticles(
  db: D1Database,
  filters?: { composition_status?: string; brain_status?: string },
): Promise<BrainArticle[]> {
  let sql = 'SELECT * FROM brain_articles WHERE 1=1';
  const params: unknown[] = [];
  if (filters?.composition_status) {
    sql += ' AND composition_status = ?';
    params.push(filters.composition_status);
  }
  if (filters?.brain_status) {
    sql += ' AND brain_status = ?';
    params.push(filters.brain_status);
  }
  sql += ' ORDER BY created_at DESC';
  const result = await db.prepare(sql).bind(...params).all<BrainArticle>();
  return result.results;
}

export async function getBrainArticleById(
  db: D1Database,
  id: string,
): Promise<BrainArticle | null> {
  return db
    .prepare('SELECT * FROM brain_articles WHERE id = ?')
    .bind(id)
    .first<BrainArticle>();
}

export async function createBrainArticle(
  db: D1Database,
  input: CreateBrainArticleInput,
): Promise<BrainArticle> {
  const now = jstNow();
  await db
    .prepare(
        `INSERT INTO brain_articles
         (id, title, body, price, category, thumbnail_prompt, seed_source,
          composition_status, brain_status, brain_url, image_status, thumbnail_status,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.title,
      input.body,
      input.price ?? 100,
      input.category ?? 'ビジネス',
      input.thumbnail_prompt ?? null,
      input.seed_source ?? null,
      input.composition_status ?? 'pending',
      input.brain_status ?? 'pending',
      input.brain_url ?? null,
      input.image_status ?? 'none',
      input.thumbnail_status ?? 'none',
      now,
      now,
    )
    .run();
  return (await getBrainArticleById(db, input.id))!;
}

export async function updateBrainArticle(
  db: D1Database,
  id: string,
  updates: Partial<{
    title: string;
    body: string;
    price: number;
    category: string;
    thumbnail_prompt: string | null;
    seed_source: string | null;
    composition_status: 'pending' | 'ready' | 'failed';
    brain_status: 'pending' | 'draft_saved' | 'under_review' | 'published' | 'failed';
    brain_url: string | null;
    image_status: 'none' | 'inserted' | 'failed';
    thumbnail_status: 'none' | 'done' | 'failed';
    last_error: string | null;
  }>,
): Promise<BrainArticle | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(updates)) {
    sets.push(`${key} = ?`);
    params.push(value ?? null);
  }
  if (sets.length === 0) return getBrainArticleById(db, id);
  sets.push('updated_at = ?');
  params.push(jstNow());
  params.push(id);
  await db
    .prepare(`UPDATE brain_articles SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();
  return getBrainArticleById(db, id);
}

export async function deleteBrainArticle(
  db: D1Database,
  id: string,
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM brain_articles WHERE id = ?')
    .bind(id)
    .run();
  return result.meta.changes > 0;
}

export async function getBrainArticleTitles(
  db: D1Database,
): Promise<{ id: string; title: string; brain_status: string; brain_url: string | null }[]> {
  const result = await db
    .prepare("SELECT id, title, brain_status, brain_url FROM brain_articles WHERE brain_status IN ('draft_saved','under_review','published')")
    .all<{ id: string; title: string; brain_status: string; brain_url: string | null }>();
  return result.results;
}
