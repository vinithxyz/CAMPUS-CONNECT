import KnowledgeArticle from '../../models/KnowledgeArticle.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { audit } from '../../utils/audit.js';

export const listKnowledge = asyncHandler(async (req, res) => {
  const { category, published, search } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (published !== undefined) filter.published = published === 'true';
  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { tags: new RegExp(search, 'i') },
      { body: new RegExp(search, 'i') },
    ];
  }

  const articles = await KnowledgeArticle.find(filter)
    .populate('updatedBy', 'name email')
    .sort({ updatedAt: -1 })
    .lean();

  res.json({ data: articles });
});

export const getKnowledgeDetail = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findById(req.params.id)
    .populate('updatedBy', 'name email')
    .lean();
  if (!article) throw new ApiError(404, 'Knowledge article not found');
  res.json({ data: article });
});

export const createKnowledge = asyncHandler(async (req, res) => {
  const { title, body, category, tags, published } = req.body;

  if (published && (title.includes('<FILL IN>') || body.includes('<FILL IN>'))) {
    throw new ApiError(400, 'Cannot publish article containing <FILL IN> placeholders. Remove them first.');
  }

  const article = await KnowledgeArticle.create({
    title,
    body,
    category,
    tags,
    published: Boolean(published),
    updatedBy: req.user._id,
  });

  audit(req, 'knowledge.create', 'knowledge', article._id, { title: article.title });
  res.status(201).json({ data: article });
});

export const updateKnowledge = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findById(req.params.id);
  if (!article) throw new ApiError(404, 'Knowledge article not found');

  const willBePublished = req.body.published !== undefined ? req.body.published : article.published;
  const targetTitle = req.body.title !== undefined ? req.body.title : article.title;
  const targetBody = req.body.body !== undefined ? req.body.body : article.body;

  if (willBePublished && (targetTitle.includes('<FILL IN>') || targetBody.includes('<FILL IN>'))) {
    throw new ApiError(400, 'Cannot publish article containing <FILL IN> placeholders. Remove them first.');
  }

  Object.assign(article, req.body, { updatedBy: req.user._id });
  await article.save();

  audit(req, 'knowledge.update', 'knowledge', article._id, { title: article.title });
  res.json({ data: article });
});

export const deleteKnowledge = asyncHandler(async (req, res) => {
  const article = await KnowledgeArticle.findById(req.params.id);
  if (!article) throw new ApiError(404, 'Knowledge article not found');

  await article.deleteOne();
  audit(req, 'knowledge.delete', 'knowledge', req.params.id, { title: article.title });
  res.status(204).end();
});
