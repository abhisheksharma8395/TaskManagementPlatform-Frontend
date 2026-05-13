import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Draggable } from '@hello-pangea/dnd';
import { MoreHorizontal, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useBoard } from '../../context/BoardContext';
import Avatar from '../Avatar/Avatar';
import styles from './Card.module.css';

const STATUS_COLORS = {
  TO_DO: { color: '#6b7280', bg: '#f3f4f6' },
  IN_PROGRESS: { color: '#7c3aed', bg: '#ede9fe' },
  IN_REVIEW: { color: '#f59e0b', bg: '#fef3c7' },
  DONE: { color: '#10b981', bg: '#d1fae5' },
};

const PRIORITY_DOTS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#7c3aed',
};

// Portal-based menu — escapes any overflow:hidden parent container
function CardMenu({ card, onEdit, updateCard, deleteCard }) {
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const handleOpen = (e) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <>
      <button ref={btnRef} className={styles.menuBtn} onClick={handleOpen} aria-label="Card options">
        <MoreHorizontal size={15} />
      </button>

      {open && createPortal(
        <div
          className={styles.menuPortal}
          style={{ top: pos.top, right: pos.right }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { onEdit(card); setOpen(false); }}>Edit</button>
          <button onClick={() => {
            updateCard(card.id, { status: card.status === 'DONE' ? 'TO_DO' : 'DONE' });
            setOpen(false);
          }}>
            {card.status === 'DONE' ? 'Mark Incomplete' : 'Mark Done'}
          </button>
          <button className={styles.danger} onClick={(e) => {
            e.stopPropagation();
            deleteCard(card.id);
            setOpen(false);
          }}>
            Delete
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

export default function Card({ card, index, onEdit, readOnly = false }) {
  const { deleteCard, updateCard, getCachedUserProfile } = useBoard();

  const statusStyle = STATUS_COLORS[card.status] || STATUS_COLORS.TO_DO;
  const priorityColor = PRIORITY_DOTS[card.priority] || '#6b7280';
  const isOverdue = card.overdue || (card.dueDate && new Date(card.dueDate) < new Date() && card.status !== 'DONE');
  const assigneeProfile = card.assigneeId ? getCachedUserProfile(card.assigneeId) : null;

  return (
    <Draggable draggableId={card.id} index={index} isDragDisabled={readOnly}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${styles.card} ${snapshot.isDragging ? styles.dragging : ''}`}
          style={{
            ...provided.draggableProps.style,
            borderTop: card.coverColor ? `4px solid ${card.coverColor}` : undefined,
          }}
          onClick={() => onEdit(card)}
        >
          {/* Status + priority row */}
          <div className={styles.topRow}>
            {card.status && card.status !== 'TO_DO' && (
              <span className={styles.statusBadge}
                style={{ background: statusStyle.bg, color: statusStyle.color }}>
                {card.status.replace('_', ' ')}
              </span>
            )}
            <div className={styles.priorityDot} style={{ background: priorityColor }} title={card.priority} />
          </div>

          {card.label && (
            <span className={styles.label}
              style={{ background: card.labelColor + '22', color: card.labelColor, border: `1px solid ${card.labelColor}44` }}>
              {card.label}
            </span>
          )}

          {/* Portal-based dropdown — never clipped */}
          {!readOnly && (
            <CardMenu
              card={card}
              onEdit={onEdit}
              updateCard={updateCard}
              deleteCard={deleteCard}
            />
          )}

          <h4 className={`${styles.title} ${card.status === 'DONE' ? styles.strikethrough : ''}`}>
            {card.title}
          </h4>

          {card.description && (
            <p className={styles.description}>
              {card.description.length > 80 ? card.description.slice(0, 80) + '...' : card.description}
            </p>
          )}

          {isOverdue && card.status !== 'DONE' && (
            <div className={styles.overdue}>
              <AlertTriangle size={11} /> Overdue
            </div>
          )}

          {card.status === 'DONE' && (
            <div className={styles.doneBadge}>
              <CheckCircle2 size={11} /> Done
            </div>
          )}

          <div className={styles.footer}>
            <div className={styles.meta}>
              {card.dueDate && (
                <span className={`${styles.dueDate} ${isOverdue ? styles.dueDateOverdue : ''}`}>
                  <Calendar size={11} />
                  {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <div className={styles.footerRight}>
              {card.assigneeId && (
                <Avatar
                  src={assigneeProfile?.avatarUrl}
                  fullName={assigneeProfile?.fullName}
                  username={assigneeProfile?.username}
                  userId={card.assigneeId}
                  size="xs"
                  showTooltip
                  tooltip={assigneeProfile?.fullName || assigneeProfile?.username || `User #${card.assigneeId}`}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
