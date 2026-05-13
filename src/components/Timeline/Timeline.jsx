/**
 * Timeline.jsx — Real data from board cards
 * Replaces mock initialData.js with actual card due dates from BoardContext.
 * Shows a Gantt-style view of cards with startDate and/or dueDate.
 */
import { useState, useMemo } from 'react';
import { Calendar, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBoard } from '../../context/BoardContext';
import styles from './Timeline.module.css';

const STATUS_COLORS = {
  TO_DO: '#6b7280',
  IN_PROGRESS: '#7c3aed',
  IN_REVIEW: '#f59e0b',
  DONE: '#10b981',
};

const PRIORITY_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#7c3aed',
};

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isoToDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export default function Timeline() {
  const { cards, lists, activeBoardId, getBoardLists } = useBoard();
  const [view, setView] = useState('Week');
  const [weekOffset, setWeekOffset] = useState(0);
  const views = ['Week', 'Month'];

  // Build the date range to show
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rangeStart = useMemo(() => {
    const base = startOfWeek(today);
    if (view === 'Week') return addDays(base, weekOffset * 7);
    return addDays(base, weekOffset * 28);
  }, [view, weekOffset, today.toDateString()]); // eslint-disable-line

  const dayCount = view === 'Week' ? 7 : 28;

  const days = useMemo(() => {
    return Array.from({ length: dayCount }, (_, i) => {
      const d = addDays(rangeStart, i);
      return {
        date: d,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        num: d.getDate(),
        isToday: d.toDateString() === today.toDateString(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      };
    });
  }, [rangeStart, dayCount]); // eslint-disable-line

  const rangeEnd = addDays(rangeStart, dayCount - 1);

  // Filter cards that belong to the active board and have at least a due date
  const boardLists = getBoardLists(activeBoardId);
  const listMap = new Map(boardLists.map((l) => [l.id, l]));

  const relevantCards = useMemo(() => {
    return cards.filter((c) => {
      if (c.boardId !== String(activeBoardId)) return false;
      if (c.archived) return false;
      const due = isoToDate(c.dueDate);
      const start = isoToDate(c.startDate);
      if (!due && !start) return false;
      // Check if the card's range overlaps with the visible range
      const cardStart = start || due;
      const cardEnd = due || start;
      return cardStart <= rangeEnd && cardEnd >= rangeStart;
    });
  }, [cards, activeBoardId, rangeStart, rangeEnd]); // eslint-disable-line

  // For each card, calculate which columns it spans
  const getCardSpan = (card) => {
    const due = isoToDate(card.dueDate);
    const start = isoToDate(card.startDate) || due;
    const end = due || start;

    // Clamp to visible range
    const clampedStart = start < rangeStart ? rangeStart : start;
    const clampedEnd = end > rangeEnd ? rangeEnd : end;

    const startIdx = Math.round((clampedStart - rangeStart) / (1000 * 60 * 60 * 24));
    const span = Math.max(1, Math.round((clampedEnd - clampedStart) / (1000 * 60 * 60 * 24)) + 1);

    return { startIdx, span };
  };

  // Group cards by list
  const cardsByList = useMemo(() => {
    const map = new Map();
    boardLists.forEach((l) => map.set(l.id, []));
    relevantCards.forEach((c) => {
      if (map.has(c.listId)) {
        map.get(c.listId).push(c);
      }
    });
    return map;
  }, [relevantCards, boardLists]);

  const colWidth = view === 'Week' ? 120 : 46;
  const rowHeaderWidth = 200;

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Timeline</h1>
          <div className={styles.viewToggle}>
            {views.map((v) => (
              <button
                key={v}
                className={`${styles.viewBtn} ${view === v ? styles.activeView : ''}`}
                onClick={() => { setView(v); setWeekOffset(0); }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.headerActions}>
          {/* Navigation */}
          <div className={styles.navBtns}>
            <button className={styles.navBtn} onClick={() => setWeekOffset((o) => o - 1)}>
              <ChevronLeft size={16} />
            </button>
            <button className={styles.todayBtn} onClick={() => setWeekOffset(0)}>Today</button>
            <button className={styles.navBtn} onClick={() => setWeekOffset((o) => o + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
          <span className={styles.rangeLabel}>
            {formatDate(rangeStart)} — {formatDate(rangeEnd)}
          </span>
        </div>
      </div>

      {/* Empty / no board state */}
      {!activeBoardId && (
        <div className={styles.emptyTimeline}>
          <Calendar size={40} />
          <h3>No board selected</h3>
          <p>Select a board from the sidebar to see its timeline.</p>
        </div>
      )}

      {activeBoardId && relevantCards.length === 0 && (
        <div className={styles.emptyTimeline}>
          <Calendar size={40} />
          <h3>No tasks in this range</h3>
          <p>Add start/due dates to your cards to see them here.</p>
        </div>
      )}

      {/* Grid */}
      {activeBoardId && (
        <div className={styles.gridContainer}>
          <div className={styles.gridWrapper}>
            {/* Header row: blank corner + day columns */}
            <div className={styles.gridHeaderRow}>
              <div className={styles.rowHeaderCell} style={{ width: rowHeaderWidth }}>
                <span className={styles.rowHeaderText}>LIST / TASK</span>
              </div>
              {days.map((d, i) => (
                <div
                  key={i}
                  className={`${styles.dayHeader} ${d.isToday ? styles.todayCol : ''} ${d.isWeekend ? styles.weekendCol : ''}`}
                  style={{ width: colWidth, minWidth: colWidth }}
                >
                  {view === 'Week' ? (
                    <>
                      <span className={styles.dayName}>{d.label}</span>
                      <span className={`${styles.dayNum} ${d.isToday ? styles.todayNum : ''}`}>{d.num}</span>
                    </>
                  ) : (
                    <span className={`${styles.dayNum} ${styles.dayNumSm} ${d.isToday ? styles.todayNum : ''}`}>{d.num}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Rows per list */}
            {boardLists.map((list) => {
              const listCards = cardsByList.get(list.id) || [];
              return (
                <div key={list.id}>
                  {/* List name row */}
                  <div className={styles.listRow}>
                    <div className={styles.listLabelCell} style={{ width: rowHeaderWidth }}>
                      <span className={styles.listLabel}>{list.name}</span>
                      <span className={styles.listCount}>{listCards.length}</span>
                    </div>
                    {days.map((d, i) => (
                      <div
                        key={i}
                        className={`${styles.dayCell} ${styles.listDivider} ${d.isWeekend ? styles.weekendCell : ''} ${d.isToday ? styles.todayCell : ''}`}
                        style={{ width: colWidth, minWidth: colWidth }}
                      />
                    ))}
                  </div>

                  {/* Card rows for this list */}
                  {listCards.map((card) => {
                    const { startIdx, span } = getCardSpan(card);
                    const barColor = STATUS_COLORS[card.status] || '#6b7280';
                    const isOverdue = card.overdue || (card.dueDate && isoToDate(card.dueDate) < today && card.status !== 'DONE');

                    return (
                      <div key={card.id} className={styles.cardRow}>
                        <div className={styles.cardLabelCell} style={{ width: rowHeaderWidth }}>
                          <div
                            className={styles.cardDot}
                            style={{ background: PRIORITY_COLORS[card.priority] || '#6b7280' }}
                          />
                          <span className={styles.cardLabel} title={card.title}>
                            {card.title.length > 22 ? card.title.slice(0, 22) + '…' : card.title}
                          </span>
                          {isOverdue && <AlertTriangle size={11} className={styles.overdueIcon} />}
                        </div>

                        {/* Day cells with bar overlay */}
                        <div className={styles.cardDayCells} style={{ width: colWidth * dayCount, minWidth: colWidth * dayCount }}>
                          {days.map((d, i) => (
                            <div
                              key={i}
                              className={`${styles.dayCell} ${d.isWeekend ? styles.weekendCell : ''} ${d.isToday ? styles.todayCell : ''}`}
                              style={{ width: colWidth, minWidth: colWidth }}
                            />
                          ))}
                          {/* The bar */}
                          <div
                            className={`${styles.taskBar} ${isOverdue ? styles.overdueBar : ''}`}
                            style={{
                              left: startIdx * colWidth + 4,
                              width: span * colWidth - 8,
                              background: isOverdue ? '#ef4444' : barColor,
                            }}
                            title={`${card.title} | ${card.status} | Due: ${card.dueDate || 'N/A'}`}
                          >
                            <span className={styles.taskBarLabel}>{card.title}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {listCards.length === 0 && (
                    <div className={styles.cardRow}>
                      <div className={styles.cardLabelCell} style={{ width: rowHeaderWidth, color: '#d1d5db', fontSize: 12 }}>
                        No dated tasks
                      </div>
                      {days.map((d, i) => (
                        <div key={i} className={`${styles.dayCell} ${d.isWeekend ? styles.weekendCell : ''}`}
                          style={{ width: colWidth, minWidth: colWidth }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
