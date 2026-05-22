import { Hono } from 'hono';
import {
  getBrainArticles,
  getBrainArticleById,
  createBrainArticle,
  updateBrainArticle,
  deleteBrainArticle,
  getBrainArticleTitles,
} from '@line-crm/db';
import type { BrainArticle } from '@line-crm/db';
import type { Env } from '../index.js';

const brainArticles = new Hono<Env>();

function serialize(row: BrainArticle) {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    category: row.category,
    thumbnailPrompt: row.thumbnail_prompt,
    seedSource: row.seed_source,
    compositionStatus: row.composition_status,
    brainStatus: row.brain_status,
    brainUrl: row.brain_url,
    imageStatus: row.image_status,
    thumbnailStatus: row.thumbnail_status,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/brain-articles — list with optional status filters
brainArticles.get('/api/brain-articles', async (c) => {
  try {
    const composition_status = c.req.query('composition_status') || undefined;
    const brain_status = c.req.query('brain_status') || undefined;
    const items = await getBrainArticles(c.env.DB, { composition_status, brain_status });
    return c.json({ success: true, data: items.map(serialize) });
  } catch (err) {
    console.error('GET /api/brain-articles error:', err);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// GET /api/brain-articles/titles — existing uploaded titles for dedup
brainArticles.get('/api/brain-articles/titles', async (c) => {
  try {
    const items = await getBrainArticleTitles(c.env.DB);
    return c.json({ success: true, data: items });
  } catch (err) {
    console.error('GET /api/brain-articles/titles error:', err);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// GET /api/brain-articles/:id — single article
brainArticles.get('/api/brain-articles/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const article = await getBrainArticleById(c.env.DB, id);
    if (!article) return c.json({ success: false, error: 'Not found' }, 404);
    return c.json({ success: true, data: serialize(article) });
  } catch (err) {
    console.error('GET /api/brain-articles/:id error:', err);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// POST /api/brain-articles — create new
brainArticles.post('/api/brain-articles', async (c) => {
  try {
    const body = await c.req.json<{
      id: string;
      title: string;
      body: string;
      price?: number;
      category?: string;
      thumbnail_prompt?: string | null;
      seed_source?: string | null;
      composition_status?: 'pending' | 'ready' | 'failed';
      brain_status?: 'pending' | 'draft_saved' | 'under_review' | 'published' | 'failed';
      image_status?: 'none' | 'inserted' | 'failed';
      thumbnail_status?: 'none' | 'done' | 'failed';
    }>();
    if (!body.id || !body.title || !body.body) {
      return c.json({ success: false, error: 'id, title, body are required' }, 400);
    }
    const article = await createBrainArticle(c.env.DB, body);
    return c.json({ success: true, data: serialize(article) }, 201);
  } catch (err) {
    console.error('POST /api/brain-articles error:', err);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// PATCH /api/brain-articles/:id — update status/fields
brainArticles.patch('/api/brain-articles/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json<Partial<{
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
    }>>();
    const article = await updateBrainArticle(c.env.DB, id, updates);
    if (!article) return c.json({ success: false, error: 'Not found' }, 404);
    return c.json({ success: true, data: serialize(article) });
  } catch (err) {
    console.error('PATCH /api/brain-articles/:id error:', err);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// DELETE /api/brain-articles/:id
brainArticles.delete('/api/brain-articles/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const ok = await deleteBrainArticle(c.env.DB, id);
    if (!ok) return c.json({ success: false, error: 'Not found' }, 404);
    return c.json({ success: true, data: null });
  } catch (err) {
    console.error('DELETE /api/brain-articles/:id error:', err);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

export { brainArticles };
