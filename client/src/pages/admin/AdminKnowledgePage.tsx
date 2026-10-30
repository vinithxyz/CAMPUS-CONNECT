import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit2,
  Trash2,
  Loader2,
  Globe,
  Tag,
  Clock,
  X,
} from 'lucide-react';
import { adminService, type KnowledgeArticleItem } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'reporting', label: 'Reporting' },
  { value: 'general', label: 'General' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'canteen', label: 'Canteen' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'emergency', label: 'Emergency' },
] as const;

export default function AdminKnowledgePage() {
  const [articles, setArticles] = useState<KnowledgeArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticleItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('general');
  const [formTags, setFormTags] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formPublished, setFormPublished] = useState(false);

  const { toast } = useToast();

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await adminService.knowledgeList();
      setArticles(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormTitle('');
    setFormCategory('general');
    setFormTags('');
    setFormBody('');
    setFormPublished(false);
    setEditorOpen(true);
  };

  const openEditModal = (article: KnowledgeArticleItem) => {
    setEditingArticle(article);
    setFormTitle(article.title);
    setFormCategory(article.category);
    setFormTags((article.tags || []).join(', '));
    setFormBody(article.body);
    setFormPublished(article.published);
    setEditorOpen(true);
  };

  const formHasFillIn = useMemo(() => {
    return formTitle.includes('<FILL IN>') || formBody.includes('<FILL IN>');
  }, [formTitle, formBody]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) {
      toast.error('Title and body are required');
      return;
    }

    if (formPublished && formHasFillIn) {
      toast.error('Cannot publish article containing <FILL IN> placeholders. Remove them first.');
      return;
    }

    setSaving(true);
    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingArticle) {
        await adminService.updateKnowledge(editingArticle._id, {
          title: formTitle.trim(),
          body: formBody.trim(),
          category: formCategory,
          tags: tagsArray,
          published: formPublished,
        });
        toast.success('Knowledge article updated');
      } else {
        await adminService.createKnowledge({
          title: formTitle.trim(),
          body: formBody.trim(),
          category: formCategory,
          tags: tagsArray,
          published: formPublished,
        });
        toast.success('Knowledge article created');
      }
      setEditorOpen(false);
      loadArticles();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminService.deleteKnowledge(id);
      toast.success('Article deleted');
      setDeleteConfirmId(null);
      loadArticles();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleTogglePublish = async (article: KnowledgeArticleItem) => {
    const nextPublished = !article.published;
    if (nextPublished && (article.title.includes('<FILL IN>') || article.body.includes('<FILL IN>'))) {
      toast.error('Cannot publish article containing <FILL IN> placeholders. Edit and remove them first.');
      return;
    }

    try {
      await adminService.updateKnowledge(article._id, { published: nextPublished });
      toast.success(nextPublished ? 'Article published' : 'Article unpublished');
      loadArticles();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
      if (publishedFilter === 'published' && !a.published) return false;
      if (publishedFilter === 'draft' && a.published) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesBody = a.body.toLowerCase().includes(q);
        const matchesTags = (a.tags || []).some((t: string) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesBody && !matchesTags) return false;

      }
      return true;
    });
  }, [articles, selectedCategory, publishedFilter, search]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-blue-600" />
            <span>Campus Knowledge Base</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative campus information searched by the AI assistant. Published articles are live to users.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by title, keywords, or tags..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Published Filter */}
          <select
            value={publishedFilter}
            onChange={(e) => setPublishedFilter(e.target.value as any)}
            className="border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Loading knowledge articles...</span>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-300 p-8">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-800">No knowledge articles found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {search || selectedCategory !== 'all' || publishedFilter !== 'all'
              ? 'Try adjusting your filters or search keywords.'
              : 'Add your first campus knowledge article to empower the AI assistant.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => {
            const hasPlaceholder =
              article.title.includes('<FILL IN>') || article.body.includes('<FILL IN>');

            return (
              <div
                key={article._id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {article.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleTogglePublish(article)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full transition ${
                        article.published
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      title={
                        article.published
                          ? 'Click to unpublish'
                          : hasPlaceholder
                          ? 'Cannot publish with <FILL IN> placeholders'
                          : 'Click to publish'
                      }
                    >
                      {article.published ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Published</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3 text-amber-600" />
                          <span>Draft</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2">
                    {article.title}
                  </h3>

                  {hasPlaceholder && (
                    <div className="mb-2.5 flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Contains &lt;FILL IN&gt; placeholders</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 line-clamp-4 whitespace-pre-wrap leading-relaxed mb-3">
                    {article.body}
                  </p>

                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}

                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(article.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(article)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 rounded-md hover:bg-slate-100 transition"
                      title="Edit article"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(article._id)}
                      className="p-1.5 text-slate-600 hover:text-red-600 rounded-md hover:bg-slate-100 transition"
                      title="Delete article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingArticle ? 'Edit Knowledge Article' : 'New Knowledge Article'}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Article Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={120}
                  required
                  placeholder="e.g. Hostel Curfew Timings"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="hostel, curfew, gate"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Content / Body <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{formBody.length} / 3000 chars</span>
                </div>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  maxLength={3000}
                  rows={6}
                  required
                  placeholder="Enter the official campus policy, timings, guidelines, or contacts..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
                />
              </div>

              {formHasFillIn && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Contains &lt;FILL IN&gt; placeholders:</span> This article
                    cannot be published until all placeholders are replaced with real campus information.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    disabled={formHasFillIn}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-xs font-medium ${formHasFillIn ? 'text-slate-400' : 'text-slate-700'}`}>
                    Publish article immediately (visible to assistant)
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditorOpen(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingArticle ? 'Save Changes' : 'Create Article'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">Delete Knowledge Article?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete this article? The AI assistant will no longer be able to use it to answer questions.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
