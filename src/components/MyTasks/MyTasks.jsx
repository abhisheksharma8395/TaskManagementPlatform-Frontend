/**
 * MyTasks.jsx — View for all cards assigned to the current user
 * Calls GET /cards/assignee/{userId}
 */
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertTriangle, CheckCircle2, Clock, LayoutList, RefreshCw, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBoard } from '../../context/BoardContext';
import * as boardService from '../../api/boardService';
import * as cardService from '../../api/cardService';
import styles from './MyTasks.module.css';

const STATUS_LABELS = {
  TO_DO: { label: 'To Do', color: '#6b7280', bg: '#f3f4f6' },
  IN_PROGRESS: { label: 'In Progress', color: '#7c3aed', bg: '#ede9fe' },
  IN_REVIEW: { label: 'In Review', color: '#f59e0b', bg: '#fef3c7' },
  DONE: { label: 'Done', color: '#10b981', bg: '#d1fae5' },
};

const PRIORITY_LABELS = {
  LOW: { label: 'Low', color: '#10b981' },
  MEDIUM: { label: 'Medium', color: '#f59e0b' },
  HIGH: { label: 'High', color: '#ef4444' },
  CRITICAL: { label: 'Critical', color: '#7c3aed' },
};

export default function MyTasks() {
  const { user } = useAuth();
  const { workspaces, publicWorkspaces, cards, boards, loadingWorkspaces } = useBoard();
  const [tasks, setTasks] = useState([]);
  const [boardMap, setBoardMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('dueDate');

  const normalizeTask = (card) => ({
    ...card,
    id: String(card.cardId ?? card.id),
    boardId: String(card.boardId),
    listId: String(card.listId),
    archived: Boolean(card.archived ?? card.isArchived),
    overdue: Boolean(card.overdue ?? card.isOverdue),
    assigneeId: card.assigneeId != null ? String(card.assigneeId) : null,
  });

  const isAssignedToUser = (task, userId) => task.assigneeId === String(userId);

  const mergeTasks = (...groups) => {
    const map = new Map();
    groups.flat().filter(Boolean).forEach((task) => {
      map.set(task.id, task);
    });
    return [...map.values()];
  };

  const fetchTasksByBoardScan = async (userId) => {
    const workspaceMap = new Map();
    [...workspaces, ...publicWorkspaces].forEach((workspace) => {
      workspaceMap.set(String(workspace.id), workspace);
    });

    const workspaceIds = [...workspaceMap.keys()];
    if (workspaceIds.length === 0) return [];

    const boardGroups = await Promise.all(
      workspaceIds.map((workspaceId) => boardService.getBoardsByWorkspace(workspaceId).catch(() => [])),
    );
    const visibleBoards = boardGroups.flat();

    const cardGroups = await Promise.all(
      visibleBoards.map((board) => {
        const boardId = board.boardId ?? board.id;
        return cardService.getCardsByBoard(boardId).catch(() => []);
      }),
    );

    return cardGroups
      .flat()
      .map(normalizeTask)
      .filter((task) => isAssignedToUser(task, userId));
  };

  const fetchTasks = async () => {
    const userId = user?.userId ?? user?.id;
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const liveContextTasks = cards.map(normalizeTask).filter((task) => isAssignedToUser(task, userId));
      const directData = await cardService.getCardsByAssignee(userId).catch(() => []);
      const directTasks = Array.isArray(directData) ? directData.map(normalizeTask) : [];

      let merged;
      if (directTasks.length > 0) {
        merged = mergeTasks(liveContextTasks, directTasks);
      } else {
        const scannedTasks = await fetchTasksByBoardScan(userId);
        merged = mergeTasks(liveContextTasks, scannedTasks);
      }
      setTasks(merged);

      // Build board map for display
      const allBoards = [...(boards || []), ...(await Promise.all(
        [...workspaces, ...publicWorkspaces].map((ws) =>
          boardService.getBoardsByWorkspace(ws.id).catch(() => [])
        )
      )).flat()];
      const map = {};
      allBoards.forEach((b) => { map[String(b.boardId ?? b.id)] = b; });
      setBoardMap(map);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const cardRefreshKey = cards
    .map((card) => [
      card.id,
      card.assigneeId,
      card.status,
      card.priority,
      card.dueDate,
      card.updatedAt,
      card.archived,
      card.isArchived,
    ].join(':'))
    .join('|');

  useEffect(() => {
    if (loadingWorkspaces) return undefined;
    const timeoutId = window.setTimeout(fetchTasks, 0);
    return () => window.clearTimeout(timeoutId);
  }, [user?.userId, user?.id, loadingWorkspaces, workspaces.length, publicWorkspaces.length, cardRefreshKey]); // eslint-disable-line

  useEffect(() => {
    if (loadingWorkspaces) return undefined;
    const refresh = () => fetchTasks();
    const intervalId = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
    };
  }, [user?.userId, user?.id, loadingWorkspaces, workspaces.length, publicWorkspaces.length, cardRefreshKey]); // eslint-disable-line

  const now = new Date();
  const filtered = tasks.filter((t) => {
    if (t.archived) return false;
    if (filter === 'ALL') return true;
    if (filter === 'OVERDUE') return t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE';
    if (filter === 'PENDING') return t.status !== 'DONE';
    if (filter === 'DONE') return t.status === 'DONE';
    return t.status === filter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortBy === 'priority') {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
    }
    return 0;
  });

  const counts = tasks.reduce((acc, t) => {
    if (!t.archived) acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <LayoutList size={22} className={styles.headerIcon} />
          <div>
            <h1 className={styles.title}>My Tasks</h1>
            <p className={styles.subtitle}>Cards assigned to you across all boards</p>
          </div>
        </div>
        <button className={styles.refreshBtn} onClick={fetchTasks} disabled={loading}>
          <RefreshCw size={15} className={loading ? styles.spin : ''} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        {Object.entries(STATUS_LABELS).map(([key, val]) => (
          <div key={key} className={styles.statCard} style={{ borderColor: val.color + '44' }}>
            <span className={styles.statNum} style={{ color: val.color }}>{counts[key] || 0}</span>
            <span className={styles.statLabel}>{val.label}</span>
          </div>
        ))}
      </div>

      {/* Filters & sort */}
      <div className={styles.controls}>
        <div className={styles.filters}>
          {['ALL', 'PENDING', 'DONE', 'OVERDUE', 'IN_PROGRESS', 'IN_REVIEW'].map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
              style={f === 'OVERDUE' ? { color: filter === f ? '#fff' : '#ef4444', borderColor: '#ef444440', background: filter === f ? '#ef4444' : undefined } : {}}
            >
              {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending' : f === 'OVERDUE' ? '⚠ Overdue' : STATUS_LABELS[f]?.label || f}
            </button>
          ))}
        </div>
        <select className={styles.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="dueDate">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
        </select>
      </div>

      {/* Content */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading your tasks...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorState}>
          <AlertTriangle size={32} />
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={fetchTasks}>Retry</button>
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className={styles.emptyState}>
          <CheckCircle2 size={40} className={styles.emptyIcon} />
          <h3>No tasks found</h3>
          <p>{filter === 'ALL' ? 'No cards are assigned to you yet.' : `No ${STATUS_LABELS[filter]?.label} tasks.`}</p>
        </div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <div className={styles.taskList}>
        {sorted.map((task) => {
            const status = STATUS_LABELS[task.status] || STATUS_LABELS.TO_DO;
            const priority = PRIORITY_LABELS[task.priority];
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
            const boardInfo = boardMap[String(task.boardId)];

            return (
              <div
                key={task.id}
                className={styles.taskCard}
                style={{ borderLeft: `3px solid ${isOverdue ? '#ef4444' : status.color}` }}
              >
                {task.coverColor && (
                  <div className={styles.taskCover} style={{ background: task.coverColor }} />
                )}
                <div className={styles.taskMain}>
                  <div className={styles.taskTop}>
                    <h4 className={styles.taskTitle}>{task.title}</h4>
                    <div className={styles.taskBadges}>
                      <span className={styles.statusBadge} style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                      {priority && (
                        <span className={styles.priorityBadge} style={{ color: priority.color }}>
                          {priority.label}
                        </span>
                      )}
                      {isOverdue && (
                        <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>⚠ Overdue</span>
                      )}
                    </div>
                  </div>

                  {task.description && (
                    <p className={styles.taskDesc}>
                      {task.description.length > 100 ? task.description.slice(0, 100) + '…' : task.description}
                    </p>
                  )}

                  <div className={styles.taskMeta}>
                    {task.dueDate && (
                      <span className={`${styles.metaChip} ${isOverdue ? styles.overdue : ''}`}>
                        {isOverdue ? <AlertTriangle size={12} /> : <Calendar size={12} />}
                        {isOverdue ? 'Overdue: ' : 'Due: '}
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {task.startDate && (
                      <span className={styles.metaChip}>
                        <Clock size={12} />
                        Started: {new Date(task.startDate).toLocaleDateString()}
                      </span>
                    )}
                    {boardInfo && (
                      <Link
                        to={`/boards/${task.boardId}`}
                        className={styles.metaChip}
                        style={{ color: '#0f766e', textDecoration: 'none', cursor: 'pointer' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={12} />
                        {boardInfo.name || `Board ${task.boardId}`}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
