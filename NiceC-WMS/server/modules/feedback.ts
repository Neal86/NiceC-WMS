import { Router } from 'express';
import { getPrisma, checkDbConnection, isJsonFallbackEnabled } from '../prisma';
import { getDB, saveDB } from '../db';
import { requireAuth, requireRole } from '../middleware';
import { feedbackCreateSchema } from '../validation';

export function registerFeedbackRoutes(router: Router): void {
  router.get('/feedback', async (req, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const feedbacks = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, include: { comments: true } });
        return res.json(feedbacks);
      } catch (err) { console.error('Prisma feedback error:', err); }
    }
    const db = getDB();
    res.json(db.feedbacks || []);
  });

  router.get('/feedback/:id', async (req, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const feedback = await prisma.feedback.findUnique({ where: { id: req.params.id }, include: { comments: true } });
        if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
        return res.json(feedback);
      } catch (err) { console.error('Prisma feedback fetch error:', err); }
    }
    const db = getDB();
    const feedback = (db.feedbacks || []).find((f: any) => f.id === req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    res.json(feedback);
  });

  router.post('/feedback', async (req, res) => {
    const { title, description, type, priority, contactEmail } = req.body;
    const parsed = feedbackCreateSchema.safeParse({ title, description, type, priority, contactEmail });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const feedback = await prisma.feedback.create({ data: { title, description, type: type || 'SUGGESTION', priority: priority || 'MEDIUM', contactEmail: contactEmail || '', status: 'OPEN', userId: (req as any).user?.id || 'anonymous', relatedPage: req.body.relatedPage || '' } });
        return res.status(201).json(feedback);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    const db = getDB();
        const feedback = { id: 'fb_' + Date.now(), title, description, type: type || 'SUGGESTION', priority: priority || 'MEDIUM', contactEmail: contactEmail || '', status: 'New' as const, userId: (req as any).user?.id || 'anonymous', relatedPage: req.body.relatedPage || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), comments: [] };
    if (!db.feedbacks) db.feedbacks = [];
    db.feedbacks.push(feedback);
    saveDB();
    return res.status(201).json(feedback);
  });

  router.patch('/feedback/:id', async (req, res) => {
    const { title, description } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.feedback.update({ where: { id: req.params.id }, data: { title, description } });
        return res.json(updated);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    const db = getDB();
    const idx = (db.feedbacks || []).findIndex((f: any) => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Feedback not found' });
    if (title !== undefined) db.feedbacks[idx].title = title;
    if (description !== undefined) db.feedbacks[idx].description = description;
    saveDB();
    res.json(db.feedbacks[idx]);
  });

  router.get('/feedback/:id/comments', async (req, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const feedback = await prisma.feedback.findUnique({ where: { id: req.params.id }, select: { comments: { orderBy: { createdAt: 'asc' } } } });
        if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
        return res.json(feedback.comments);
      } catch (err) { console.error('Prisma feedback comments error:', err); }
    }
    const db = getDB();
    const feedback = (db.feedbacks || []).find((f: any) => f.id === req.params.id);
    res.json(feedback?.comments || []);
  });

  router.post('/feedback/:id/comments', async (req, res) => {
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ error: 'Comment is required' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const created = await prisma.feedbackComment.create({ data: { feedbackId: req.params.id, userId: (req as any).user?.id || 'anonymous', comment } });
        return res.status(201).json(created);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    const db = getDB();
    const feedback = (db.feedbacks || []).find((f: any) => f.id === req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    const fbComment = { id: 'fc_' + Date.now(), feedbackId: req.params.id, userId: (req as any).user?.id || 'anonymous', comment, isInternal: false, createdAt: new Date().toISOString() };
    if (!feedback.comments) feedback.comments = [];
    feedback.comments.push(fbComment);
    saveDB();
    return res.status(201).json(fbComment);
  });

  router.get('/admin/feedback', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const feedbacks = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, include: { comments: true } });
        return res.json(feedbacks);
      } catch (err) { console.error('Prisma admin feedback error:', err); }
    }
    const db = getDB();
    res.json(db.feedbacks || []);
  });

  router.get('/admin/feedback/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const feedback = await prisma.feedback.findUnique({ where: { id: req.params.id }, include: { comments: true } });
        if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
        return res.json(feedback);
      } catch (err) { console.error('Prisma admin feedback fetch error:', err); }
    }
    const db = getDB();
    const feedback = (db.feedbacks || []).find((f: any) => f.id === req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    res.json(feedback);
  });

  router.patch('/admin/feedback/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { status, internalNotes, priority } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updateData: any = {};
        if (status) updateData.status = status;
        if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
        if (priority) updateData.priority = priority;
        const updated = await prisma.feedback.update({ where: { id: req.params.id }, data: updateData });
        return res.json(updated);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    const db = getDB();
    const idx = (db.feedbacks || []).findIndex((f: any) => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Feedback not found' });
    if (status) db.feedbacks[idx].status = status;
    if (internalNotes !== undefined) db.feedbacks[idx].internalNotes = internalNotes;
    saveDB();
    res.json(db.feedbacks[idx]);
  });

  router.post('/admin/feedback/:id/assign', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { assignee } = req.body;
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.feedback.update({ where: { id: req.params.id }, data: { assignedToUserId: assignee } });
        return res.json(updated);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, assignedToUserId: assignee });
  });

  router.post('/admin/feedback/:id/status', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: any, res) => {
    const { status } = req.body;
    if (!status || !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const hasDb = await checkDbConnection();
    if (hasDb) {
      const prisma = getPrisma();
      try {
        const updated = await prisma.feedback.update({ where: { id: req.params.id }, data: { status } });
        return res.json(updated);
      } catch (err: any) { return res.status(400).json({ error: err.message }); }
    }
    return res.json({ id: req.params.id, status });
  });
}
