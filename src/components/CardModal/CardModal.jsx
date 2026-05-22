/**
 * CardModal.jsx — Full-featured card modal
 * Implements: comments, attachments, labels, checklists, status, assignee, start date, cover color
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Tag, CheckSquare, MessageCircle,
  Calendar, User, AlignLeft, Plus, Trash2, Edit2,
  Check, CornerDownRight, Palette,
} from 'lucide-react';
import { useBoard } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';
import { canEditComment } from '../../utils/permissions';
import * as commentService from '../../api/commentService';
import * as labelService from '../../api/labelService';
import * as cardService from '../../api/cardService';
import * as authService from '../../api/authService';
import AttachmentUpload from '../AttachmentUpload/AttachmentUpload';
import Avatar from '../Avatar/Avatar';
import ColorWheelPicker from '../ColorWheelPicker/ColorWheelPicker';
import styles from './CardModal.module.css';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: '🟢 Low', color: '#10b981' },
  { value: 'MEDIUM', label: '🟡 Medium', color: '#f59e0b' },
  { value: 'HIGH', label: '🔴 High', color: '#ef4444' },
  { value: 'CRITICAL', label: '⚠️ Critical', color: '#7c3aed' },
];

const STATUS_OPTIONS = [
  { value: 'TO_DO', label: 'To Do', color: '#6b7280' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#7c3aed' },
  { value: 'IN_REVIEW', label: 'In Review', color: '#f59e0b' },
  { value: 'DONE', label: 'Done', color: '#10b981' },
];


const LABEL_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#3b82f6', '#7c3aed', '#ec4899',
];

export default function CardModal({ card, onClose, readOnly = false }) {
  const {
    addCard,
    updateCard,
    setCardAssignee,
    lists,
    activeBoardId,
    getCachedBoardMembers,
    activeWorkspaceId,
    getCachedWorkspaceMembers,
  } = useBoard();
  const { user } = useAuth();
  const isNew = !card.id;

  const [form, setForm] = useState({
    title: card.title || '',
    description: card.description || '',
    priority: card.priority || 'MEDIUM',
    status: card.status || 'TO_DO',
    dueDate: card.dueDate ? String(card.dueDate).slice(0, 10) : '',
    startDate: card.startDate ? String(card.startDate).slice(0, 10) : '',
    listId: card.listId || '',
    coverColor: card.coverColor || '',
  });
  const [saving, setSaving] = useState(false);

  // Assignee
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [assigneeUser, setAssigneeUser] = useState(null);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replies, setReplies] = useState({});

  // Attachments
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  // Labels
  const [boardLabels, setBoardLabels] = useState([]);
  const [cardLabels, setCardLabels] = useState([]);
  const [showLabelPanel, setShowLabelPanel] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: '', color: LABEL_COLORS[0] });
  const [creatingLabel, setCreatingLabel] = useState(false);

  // Checklists
  const [checklists, setChecklists] = useState([]);
  const [checklistsLoading, setChecklistsLoading] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [newItemTexts, setNewItemTexts] = useState({});
  const [addingItemTo, setAddingItemTo] = useState(null);

  const boardLists = lists.filter((l) => l.boardId === String(activeBoardId));
  const boardMembers = getCachedBoardMembers(activeBoardId);
  const workspaceMembers = getCachedWorkspaceMembers(activeWorkspaceId);
  const searchTimeout = useRef(null);
  const userProfileCache = useRef({});

  // Cover colour wheel
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [coverPopupPos, setCoverPopupPos] = useState({ top: 0, left: 0 });
  const coverTriggerRef = useRef(null);
  const coverPopupRef = useRef(null);

  const openCoverPicker = () => {
    if (coverTriggerRef.current) {
      const r = coverTriggerRef.current.getBoundingClientRect();
      setCoverPopupPos({ top: r.bottom + 8, left: r.left });
    }
    setShowCoverPicker(true);
  };

  useEffect(() => {
    if (!showCoverPicker) return undefined;
    const handler = (e) => {
      const inTrigger = coverTriggerRef.current?.contains(e.target);
      const inPopup   = coverPopupRef.current?.contains(e.target);
      if (!inTrigger && !inPopup) setShowCoverPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCoverPicker]);

  useEffect(() => {
    if (isNew) return;
    loadComments();
    loadAttachments();
    loadLabels();
    loadChecklists();
    loadAssignee();
  }, [card.id]); // eslint-disable-line

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const data = await commentService.getCommentsByCard(card.id);
      setComments(await hydrateCommentAuthors(Array.isArray(data) ? data : []));
    } catch { /* silent */ } finally { setCommentsLoading(false); }
  };

  const loadAttachments = async () => {
    setAttachmentsLoading(true);
    try {
      const data = await commentService.getAttachmentsByCard(card.id);
      setAttachments(Array.isArray(data) ? data : []);
    } catch { /* silent */ } finally { setAttachmentsLoading(false); }
  };

  const loadLabels = async () => {
    try {
      const [board, cardL] = await Promise.all([
        labelService.getLabelsByBoard(activeBoardId),
        labelService.getLabelsForCard(card.id),
      ]);
      setBoardLabels(Array.isArray(board) ? board : []);
      setCardLabels(Array.isArray(cardL) ? cardL : []);
    } catch { /* silent */ }
  };

  const normalizeChecklistItem = (item) => ({
    ...item,
    itemId: item.itemId ?? item.id,
    title: item.title ?? item.text ?? item.content ?? item.name ?? '',
    completed: Boolean(item.completed ?? item.isCompleted ?? item.done),
  });

  const loadChecklists = async () => {
    setChecklistsLoading(true);
    try {
      const data = await labelService.getChecklistsByCard(card.id);
      const rawLists = Array.isArray(data) ? data : [];
      // Normalize and ensure items are present
      const withItems = rawLists.map((cl) => ({
        ...cl,
        checklistId: cl.checklistId ?? cl.id,
        items: Array.isArray(cl.items)
          ? cl.items.map(normalizeChecklistItem)
          : [],
      }));
      setChecklists(withItems);
    } catch { /* silent */ } finally { setChecklistsLoading(false); }
  };

  const loadAssignee = async () => {
    if (!card.assigneeId) return;
    try {
      const u = await authService.getUserById(card.assigneeId);
      setAssigneeUser(u);
    } catch { /* silent */ }
  };

  const getCommentDisplayName = (comment) => {
    const name = comment.authorName || comment.authorFullName || comment.fullName || comment.authorUsername || comment.username;
    if (name && !/^User\s+\d+$/i.test(name)) return name;
    return comment.authorUsername || comment.username || name || `User ${comment.authorId}`;
  };

  const hydrateCommentAuthors = async (items) => {
    return Promise.all(items.map(async (comment) => {
      if (!comment.authorId) return comment;
      if (!userProfileCache.current[comment.authorId]) {
        try {
          userProfileCache.current[comment.authorId] = await authService.getUserById(comment.authorId);
        } catch {
          userProfileCache.current[comment.authorId] = null;
        }
      }
      const profile = userProfileCache.current[comment.authorId];
      if (!profile) return comment;
      return {
        ...comment,
        authorName: profile.fullName || profile.username || comment.authorName,
        authorUsername: profile.username || comment.authorUsername,
        authorAvatarUrl: profile.avatarUrl || comment.authorAvatarUrl,
      };
    }));
  };

  // Assignee search
  const handleAssigneeSearch = (val) => {
    setAssigneeSearch(val);
    clearTimeout(searchTimeout.current);
    if (!val.trim()) {
      const suggestions = boardMembers.length > 0 ? boardMembers : workspaceMembers;
      setSearchResults(suggestions);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await authService.searchUsersByName(val);
        setSearchResults(Array.isArray(res) ? res : []);
      } catch { /* silent */ } finally { setSearchLoading(false); }
    }, 350);
  };

  const handleAssigneeFocus = () => {
    setShowAssigneeDropdown(true);
    if (!assigneeSearch.trim()) {
      const suggestions = boardMembers.length > 0 ? boardMembers : workspaceMembers;
      setSearchResults(suggestions);
    }
  };

  const handleAssign = async (u) => {
    setAssigneeUser(u);
    setAssigneeSearch(''); setSearchResults([]); setShowAssigneeDropdown(false);
    if (!isNew) {
      try { await setCardAssignee(card.id, u); } catch { /* silent */ }
    }
  };

  const handleUnassign = async () => {
    setAssigneeUser(null);
    if (!isNew) {
      try { await setCardAssignee(card.id, null); } catch { /* silent */ }
    }
  };

  // Comments
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const data = await commentService.addComment({
        cardId: Number(card.id),
        content: newComment.trim(),
        ...(replyTo ? { parentCommentId: replyTo.commentId } : {}),
      });
      const authoredComment = {
        ...data,
        authorName: user?.fullName || user?.username || data.authorName,
        authorUsername: user?.username || data.authorUsername,
        authorAvatarUrl: user?.avatarUrl || data.authorAvatarUrl,
      };
      if (replyTo) {
        setReplies((p) => ({ ...p, [replyTo.commentId]: [...(p[replyTo.commentId] || []), authoredComment] }));
        setExpandedReplies((p) => ({ ...p, [replyTo.commentId]: true }));
      } else {
        setComments((p) => [authoredComment, ...p]);
      }
      setNewComment(''); setReplyTo(null);
    } catch { /* silent */ } finally { setSubmittingComment(false); }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      const updated = await commentService.updateComment(commentId, { content: editContent.trim() });
      setComments((p) => p.map((c) => c.commentId === commentId ? updated : c));
      setEditingComment(null); setEditContent('');
    } catch { /* silent */ }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setComments((p) => p.filter((c) => c.commentId !== commentId));
    } catch { /* silent */ }
  };

  const loadReplies = async (commentId) => {
    if (expandedReplies[commentId]) {
      setExpandedReplies((p) => ({ ...p, [commentId]: false })); return;
    }
    try {
      const data = await commentService.getReplies(commentId);
      setReplies((p) => ({ ...p, [commentId]: [] }));
      const hydrated = await hydrateCommentAuthors(Array.isArray(data) ? data : []);
      setReplies((p) => ({ ...p, [commentId]: hydrated }));
      setExpandedReplies((p) => ({ ...p, [commentId]: true }));
    } catch { /* silent */ }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await commentService.deleteAttachment(attachmentId);
      setAttachments((p) => p.filter((a) => a.attachmentId !== attachmentId));
    } catch { /* silent */ }
  };

  const handleAttachmentsUploaded = (uploaded) => {
    setAttachments((p) => [...p, ...uploaded]);
  };

  // Labels
  const handleToggleLabel = async (label) => {
    const isAttached = cardLabels.some((l) => l.labelId === label.labelId);
    try {
      if (isAttached) {
        await labelService.removeLabelFromCard(card.id, label.labelId);
        setCardLabels((p) => p.filter((l) => l.labelId !== label.labelId));
      } else {
        await labelService.addLabelToCard({ cardId: Number(card.id), labelId: label.labelId });
        setCardLabels((p) => [...p, label]);
      }
    } catch { /* silent */ }
  };

  const handleCreateLabel = async () => {
    if (!newLabel.name.trim()) return;
    setCreatingLabel(true);
    try {
      const created = await labelService.createLabel({ boardId: Number(activeBoardId), name: newLabel.name.trim(), color: newLabel.color });
      setBoardLabels((p) => [...p, created]);
      setNewLabel({ name: '', color: LABEL_COLORS[0] });
    } catch { /* silent */ } finally { setCreatingLabel(false); }
  };

  // Checklists
  const handleCreateChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    try {
      const created = await labelService.createChecklist({ cardId: Number(card.id), title: newChecklistTitle.trim() });
      const normalizedChecklist = { ...created, checklistId: created.checklistId ?? created.id, items: [] };
      setChecklists((p) => [...p, normalizedChecklist]);
      setNewChecklistTitle(''); setAddingChecklist(false);
    } catch { /* silent */ }
  };

  const handleDeleteChecklist = async (checklistId) => {
    try {
      await labelService.deleteChecklist(checklistId);
      setChecklists((p) => p.filter((c) => c.checklistId !== checklistId));
    } catch { /* silent */ }
  };

  const handleAddItem = async (checklistId) => {
    const title = newItemTexts[checklistId]?.trim();
    if (!title) return;
    try {
      const raw = await labelService.addChecklistItem(checklistId, { text: title });
      if (raw && (raw.id || raw.itemId)) {
        // API returned the created item — update state directly
        const item = normalizeChecklistItem(raw);
        setChecklists((p) => p.map((cl) => cl.checklistId === checklistId
          ? { ...cl, items: [...(cl.items || []), item] }
          : cl));
      } else {
        // API returned null/empty — reload to get the persisted item
        await loadChecklists();
      }
      setNewItemTexts((p) => ({ ...p, [checklistId]: '' }));
      setAddingItemTo(null);
    } catch (err) {
      console.error('[handleAddItem] failed:', err);
    }
  };

  const handleToggleItem = async (checklistId, itemId) => {
    try {
      const updated = await labelService.toggleChecklistItem(itemId);
      setChecklists((p) => p.map((cl) => cl.checklistId === checklistId
        ? { ...cl, items: (cl.items || []).map((it) => it.itemId === itemId ? { ...it, completed: updated.completed } : it) }
        : cl));
    } catch { /* silent */ }
  };

  const handleDeleteItem = async (checklistId, itemId) => {
    try {
      await labelService.deleteChecklistItem(itemId);
      setChecklists((p) => p.map((cl) => cl.checklistId === checklistId ? { ...cl, items: (cl.items || []).filter((it) => it.itemId !== itemId) } : cl));
    } catch { /* silent */ }
  };

  const handleStatusChange = async (status) => {
    setForm((p) => ({ ...p, status }));
    if (!isNew) { try { await cardService.setStatus(card.id, { status }); } catch { /* silent */ } }
  };

  const handlePriorityChange = async (priority) => {
    setForm((p) => ({ ...p, priority }));
    if (!isNew) { try { await cardService.setPriority(card.id, { priority }); } catch { /* silent */ } }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (isNew) {
        const created = await addCard({
          listId: Number(form.listId || card.listId),
          boardId: Number(activeBoardId),
          title: form.title.trim(),
          description: form.description,
          priority: form.priority,
          dueDate: form.dueDate || null,
          startDate: form.startDate || null,
          assigneeId: assigneeUser?.userId || null,
          coverColor: form.coverColor || null,
        });
        if (form.status !== 'TO_DO') {
          await cardService.setStatus(created.id, { status: form.status });
        }
      } else {
        await updateCard(card.id, {
          title: form.title.trim(),
          description: form.description,
          priority: form.priority,
          status: form.status,
          dueDate: form.dueDate || null,
          startDate: form.startDate || null,
          assigneeId: assigneeUser?.userId || null,
          coverColor: form.coverColor || null,
        });
      }
      onClose();
    } finally { setSaving(false); }
  };

  const getChecklistProgress = (cl) => {
    const items = cl.items || [];
    if (!items.length) return 0;
    return Math.round((items.filter((i) => i.completed).length / items.length) * 100);
  };

  const statusOpt = STATUS_OPTIONS.find((s) => s.value === form.status);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {form.coverColor && <div className={styles.coverStrip} style={{ background: form.coverColor }} />}

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.modalTitle}>{isNew ? 'Add Task' : readOnly ? 'View Task' : 'Edit Task'}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.body}>
          {/* Left column */}
          <div className={styles.leftCol}>
            <div className={styles.field}>
              <label className={styles.label}><AlignLeft size={13} /> Task Title</label>
              <input type="text" className={styles.input} value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Enter task title..." autoFocus disabled={readOnly} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}><AlignLeft size={13} /> Description</label>
              <textarea className={styles.textarea} value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Add a description..." rows={3} disabled={readOnly} />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Status</label>
                <div className={styles.selectWrapper}>
                  <select className={styles.select} value={form.status}
                    style={{ borderColor: (statusOpt?.color || '#6b7280') + '66', color: statusOpt?.color }}
                    onChange={(e) => handleStatusChange(e.target.value)} disabled={readOnly}>
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Priority</label>
                <div className={styles.selectWrapper}>
                  <select className={styles.select} value={form.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)} disabled={readOnly}>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}><Calendar size={13} /> Start Date</label>
                <input type="date" className={styles.input} value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} disabled={readOnly} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}><Calendar size={13} /> Due Date</label>
                <input type="date" className={styles.input} value={form.dueDate}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} disabled={readOnly} />
              </div>
            </div>

            {isNew && boardLists.length > 1 && (
              <div className={styles.field}>
                <label className={styles.label}>List</label>
                <div className={styles.selectWrapper}>
                  <select className={styles.select} value={form.listId}
                    onChange={(e) => setForm((p) => ({ ...p, listId: e.target.value }))} disabled={readOnly}>
                    {boardLists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Labels */}
            {!isNew && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Tag size={14} /><span>Labels</span>
                  {!readOnly && <button className={styles.sectionBtn} onClick={() => setShowLabelPanel(!showLabelPanel)}><Plus size={13} /></button>}
                </div>
                {cardLabels.length > 0 && (
                  <div className={styles.labelsRow}>
                    {cardLabels.map((lbl) => (
                      <span key={lbl.labelId} className={styles.labelChip}
                        style={{ background: lbl.color + '22', color: lbl.color, borderColor: lbl.color + '55' }}>
                        {lbl.name}
                        {!readOnly && <button onClick={() => handleToggleLabel(lbl)} className={styles.chipRemove}>×</button>}
                      </span>
                    ))}
                  </div>
                )}
                {showLabelPanel && (
                  <div className={styles.labelPanel}>
                    <p className={styles.panelTitle}>Board Labels</p>
                    {boardLabels.map((lbl) => {
                      const attached = cardLabels.some((l) => l.labelId === lbl.labelId);
                      return (
                        <div key={lbl.labelId} className={`${styles.labelRow} ${attached ? styles.labelAttached : ''}`}
                          onClick={() => !readOnly && handleToggleLabel(lbl)}>
                          <span className={styles.labelDot} style={{ background: lbl.color }} />
                          <span>{lbl.name}</span>
                          {attached && <Check size={13} className={styles.checkIcon} />}
                        </div>
                      );
                    })}
                    {!readOnly && <div className={styles.createLabelRow}>
                      <input className={styles.smallInput} placeholder="New label name..."
                        value={newLabel.name} onChange={(e) => setNewLabel((p) => ({ ...p, name: e.target.value }))} />
                      <div className={styles.colorPicker}>
                        {LABEL_COLORS.map((c) => (
                          <button key={c} className={`${styles.colorDot} ${newLabel.color === c ? styles.colorSelected : ''}`}
                            style={{ background: c }} onClick={() => setNewLabel((p) => ({ ...p, color: c }))} />
                        ))}
                      </div>
                      <button className={styles.smallBtn} onClick={handleCreateLabel} disabled={creatingLabel || !newLabel.name.trim()}>
                        {creatingLabel ? '...' : 'Create'}
                      </button>
                    </div>}
                  </div>
                )}
              </div>
            )}

            {/* Checklists */}
            {!isNew && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <CheckSquare size={14} /><span>Checklists</span>
                  {!readOnly && <button className={styles.sectionBtn} onClick={() => setAddingChecklist(true)}><Plus size={13} /></button>}
                </div>
                {checklistsLoading && <div className={styles.loadingText}>Loading...</div>}
                {checklists.map((cl) => {
                  const progress = getChecklistProgress(cl);
                  const itemsDone = (cl.items || []).filter((i) => i.completed).length;
                  const itemsTotal = (cl.items || []).length;
                  return (
                    <div key={cl.checklistId} className={styles.checklist}>
                      <div className={styles.checklistHeader}>
                        <span className={styles.checklistTitle}>{cl.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`${styles.checklistCountBadge} ${itemsDone === itemsTotal && itemsTotal > 0 ? styles.checklistCountDone : ''}`}>
                            <CheckSquare size={11} />{itemsDone}/{itemsTotal}
                          </span>
                          <span className={styles.progressPct}>{progress}%</span>
                          <button className={styles.deleteBtn} onClick={() => handleDeleteChecklist(cl.checklistId)}><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                      </div>
                      {(cl.items || []).map((item) => (
                        <div key={item.itemId} className={styles.checkItem}>
                          <input type="checkbox" checked={item.completed}
                            onChange={() => handleToggleItem(cl.checklistId, item.itemId)} className={styles.checkbox} />
                          <span className={`${styles.itemTitle} ${item.completed ? styles.itemDone : ''}`}>{item.title}</span>
                          <button className={styles.deleteBtn} onClick={() => handleDeleteItem(cl.checklistId, item.itemId)}><Trash2 size={11} /></button>
                        </div>
                      ))}
                      {addingItemTo === cl.checklistId ? (
                        <div className={styles.addItemRow}>
                          <input autoFocus className={styles.smallInput} placeholder="Item title..."
                            value={newItemTexts[cl.checklistId] || ''}
                            onChange={(e) => setNewItemTexts((p) => ({ ...p, [cl.checklistId]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(cl.checklistId); if (e.key === 'Escape') setAddingItemTo(null); }} />
                          <button className={styles.smallBtn} onClick={() => handleAddItem(cl.checklistId)}>Add</button>
                          <button className={styles.cancelSmall} onClick={() => setAddingItemTo(null)}>×</button>
                        </div>
                      ) : (
                        <button className={styles.addItemBtn} onClick={() => setAddingItemTo(cl.checklistId)}>
                          <Plus size={12} /> Add item
                        </button>
                      )}
                    </div>
                  );
                })}
                {addingChecklist && (
                  <div className={styles.addItemRow}>
                    <input autoFocus className={styles.smallInput} placeholder="Checklist title..."
                      value={newChecklistTitle} onChange={(e) => setNewChecklistTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateChecklist(); if (e.key === 'Escape') setAddingChecklist(false); }} />
                    <button className={styles.smallBtn} onClick={handleCreateChecklist}>Create</button>
                    <button className={styles.cancelSmall} onClick={() => setAddingChecklist(false)}>×</button>
                  </div>
                )}
              </div>
            )}

            {/* Attachments */}
            {!isNew && (
              <AttachmentUpload
                cardId={Number(card.id)}
                attachments={attachments}
                loading={attachmentsLoading}
                readOnly={readOnly}
                onUploaded={handleAttachmentsUploaded}
                onDelete={handleDeleteAttachment}
              />
            )}

            {/* Comments */}
            {!isNew && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <MessageCircle size={14} /><span>Comments</span>
                </div>
                {!readOnly && replyTo && (
                  <div className={styles.replyingTo}>
                    <CornerDownRight size={13} />
                    Replying to <strong>{replyTo.authorName || replyTo.authorUsername || `User ${replyTo.authorId}`}</strong>
                    <button onClick={() => setReplyTo(null)}>×</button>
                  </div>
                )}
                {!readOnly && <div className={styles.commentInputRow}>
                  <Avatar
                    src={user?.avatarUrl}
                    fullName={user?.fullName}
                    username={user?.username}
                    userId={user?.userId}
                    size="sm"
                  />
                  <textarea className={styles.commentInput} rows={2}
                    placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
                    value={newComment} onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleAddComment(); }} />
                  <button className={styles.commentSubmit} onClick={handleAddComment}
                    disabled={submittingComment || !newComment.trim()}>
                    {submittingComment ? '...' : 'Post'}
                  </button>
                </div>}
                {commentsLoading && <div className={styles.loadingText}>Loading comments...</div>}
                <div className={styles.commentsList}>
                  {comments.map((c) => (
                    <div key={c.commentId} className={styles.comment}>
                      <Avatar
                        src={c.authorAvatarUrl}
                        fullName={c.authorName || c.authorFullName}
                        username={c.authorUsername}
                        userId={c.authorId}
                        size="sm"
                      />
                      <div className={styles.commentContent}>
                        <div className={styles.commentHeader}>
                          <span className={styles.commentAuthor}>{getCommentDisplayName(c)}</span>
                          <span className={styles.commentTime}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                        {editingComment === c.commentId ? (
                          <div>
                            <textarea className={styles.commentInput} value={editContent}
                              onChange={(e) => setEditContent(e.target.value)} rows={2} autoFocus />
                            <div className={styles.addItemRow}>
                              <button className={styles.smallBtn} onClick={() => handleEditComment(c.commentId)}>Save</button>
                              <button className={styles.cancelSmall} onClick={() => setEditingComment(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <p className={styles.commentText}>{c.content}</p>
                        )}
                        <div className={styles.commentActions}>
                          {!readOnly && <button className={styles.commentAction} onClick={() => setReplyTo(c)}>Reply</button>}
                          {c.replyCount > 0 && (
                            <button className={styles.commentAction} onClick={() => loadReplies(c.commentId)}>
                              {expandedReplies[c.commentId] ? 'Hide replies' : `${c.replyCount} replies`}
                            </button>
                          )}
                          {!readOnly && canEditComment(user, c) && (
                            <button className={styles.commentAction}
                              onClick={() => { setEditingComment(c.commentId); setEditContent(c.content); }}>
                              <Edit2 size={11} />
                            </button>
                          )}
                          {!readOnly && canEditComment(user, c) && (
                            <button className={`${styles.commentAction} ${styles.dangerAction}`}
                              onClick={() => handleDeleteComment(c.commentId)}><Trash2 size={11} /></button>
                          )}
                        </div>
                        {expandedReplies[c.commentId] && (replies[c.commentId] || []).map((reply) => (
                          <div key={reply.commentId} className={styles.reply}>
                            <Avatar
                              src={reply.authorAvatarUrl}
                              fullName={reply.authorName || reply.authorFullName}
                              username={reply.authorUsername}
                              userId={reply.authorId}
                              size="xs"
                            />
                            <div className={styles.commentContent}>
                              <div className={styles.commentHeader}>
                                <span className={styles.commentAuthor}>{getCommentDisplayName(reply)}</span>
                              </div>
                              <p className={styles.commentText}>{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className={styles.rightCol}>
            {/* Assignee */}
            <div className={styles.sideField}>
              <label className={styles.sideLabel}><User size={13} /> Assignee</label>
              {assigneeUser ? (
                <div className={styles.assigneeChip}>
                  <Avatar
                    src={assigneeUser.avatarUrl}
                    fullName={assigneeUser.fullName}
                    username={assigneeUser.username}
                    userId={assigneeUser.userId}
                    size="sm"
                  />
                  <span>{assigneeUser.fullName || assigneeUser.username}</span>
                  {!readOnly && <button className={styles.chipRemove} onClick={handleUnassign}>×</button>}
                </div>
              ) : (
                <div className={styles.assigneeSearch}>
                  <input className={styles.smallInput} placeholder="Search by name..."
                    value={assigneeSearch} onChange={(e) => handleAssigneeSearch(e.target.value)}
                    onFocus={handleAssigneeFocus}
                    onBlur={() => setTimeout(() => setShowAssigneeDropdown(false), 200)} disabled={readOnly} />
                  {searchLoading && <div className={styles.loadingText}>Searching...</div>}
                  {showAssigneeDropdown && searchResults.length > 0 && (
                    <div className={styles.searchDropdown}>
                      {searchResults.map((u) => (
                        <div key={u.userId} className={styles.searchResultItem} onMouseDown={(e) => { e.preventDefault(); if (!readOnly) handleAssign(u); }}>
                          <Avatar
                            src={u.avatarUrl}
                            fullName={u.fullName}
                            username={u.username}
                            userId={u.userId}
                            size="sm"
                          />
                          <div>
                            <div className={styles.resultName}>{u.fullName || u.username}</div>
                            <div className={styles.resultEmail}>{u.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cover color */}
            <div className={styles.sideField}>
              <label className={styles.sideLabel}>Cover Color</label>
              <div className={styles.coverPickerWrapper}>
                <button
                  ref={coverTriggerRef}
                  type="button"
                  className={styles.coverPickerTrigger}
                  style={{ background: form.coverColor || '#f3f4f6' }}
                  onClick={() => { if (!readOnly) openCoverPicker(); }}
                  title={form.coverColor ? 'Change cover colour' : 'Choose cover colour'}
                  disabled={readOnly}
                >
                  {!form.coverColor && <Palette size={14} />}
                </button>
                {form.coverColor && (
                  <span className={styles.coverHex}>{form.coverColor}</span>
                )}
              </div>

              {/* Portal: renders outside overflow:hidden modal */}
              {showCoverPicker && createPortal(
                <div
                  ref={coverPopupRef}
                  className={styles.coverWheelPortal}
                  style={{ top: coverPopupPos.top, left: coverPopupPos.left }}
                >
                  <p className={styles.coverWheelTitle}>Pick a cover colour</p>
                  <ColorWheelPicker
                    value={form.coverColor}
                    onChange={(hex) => setForm((p) => ({ ...p, coverColor: hex }))}
                  />
                  <div className={styles.coverWheelActions}>
                    <button
                      type="button"
                      className={styles.coverClearBtn}
                      onClick={() => { setForm((p) => ({ ...p, coverColor: '' })); setShowCoverPicker(false); }}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className={styles.coverDoneBtn}
                      onClick={() => setShowCoverPicker(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>,
                document.body,
              )}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>{readOnly ? 'Close' : 'Cancel'}</button>
          {!readOnly && (
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving ? 'Saving...' : isNew ? 'Add Task' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
