/**
 * List.jsx
 * Renders a Kanban column with its cards.
 *
 * Key fixes from original:
 * 1. Backend `ListResponse` uses `name` field (not `title`).
 *    Changed all `list.title` references to `list.name`.
 * 2. `list.id` is now a normalized string (e.g. "5"), which is safe for Droppable.
 * 3. deleteList now calls backend (via BoardContext).
 * 4. Guest role fix: guests cannot see Add Card, Edit, Delete controls.
 */
import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, X, MoreHorizontal } from 'lucide-react';
import { useBoard } from '../../context/BoardContext';
import Card from '../Card/Card';
import styles from './List.module.css';

export default function List({ list, onEditCard, canCollaborate = true, readOnly = false }) {
  const { getListCards, addCard, updateList, deleteList } = useBoard();
  // list.id is a normalized string from BoardContext
  const cards = getListCards(list.id);

  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [listName, setListName] = useState(list.name || '');

  const handleAddCard = () => {
    if (readOnly) return; // Prevent guests from adding
    if (newCardTitle.trim()) {
      addCard({
        listId: Number(list.id),
        boardId: Number(list.boardId),
        title: newCardTitle.trim(),
      });
      setNewCardTitle('');
      setAddingCard(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAddCard();
    if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); }
  };

  const handleSaveListName = async () => {
    const nextName = listName.trim();
    if (!nextName || nextName === list.name) {
      setListName(list.name || '');
      setEditingName(false);
      return;
    }

    try {
      await updateList(list.id, { name: nextName });
      setEditingName(false);
    } catch {
      setListName(list.name || '');
      setEditingName(false);
    }
  };

  const handleListNameKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveListName();
    if (e.key === 'Escape') {
      setListName(list.name || '');
      setEditingName(false);
    }
  };

  // Color map keyed on list name (common Kanban column names)
  const headerColors = {
    'TO DO': '#6b7280',
    'TODO': '#6b7280',
    'IN PROGRESS': '#7C3AED',
    'DONE': '#10b981',
    'IN REVIEW': '#F59E0B',
  };
  // Use list.name (backend field), fall back to a neutral colour
  const headerColor = headerColors[(list.name || '').toUpperCase()] || '#6b7280';

  return (
    <div className={styles.list}>
      {/* List Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {editingName && canCollaborate && !readOnly ? (
            <input
              className={styles.titleInput}
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              onBlur={handleSaveListName}
              onKeyDown={handleListNameKeyDown}
              autoFocus
            />
          ) : (
            <button
              className={styles.titleBtn}
              style={{ color: headerColor }}
              onClick={() => {
                if (!canCollaborate || readOnly) return;
                setListName(list.name || '');
                setEditingName(true);
              }}
              title={canCollaborate && !readOnly ? 'Edit list name' : undefined}
            >
              {list.name}
            </button>
          )}
          <span className={styles.count} style={{ background: headerColor + '22', color: headerColor }}>
            {cards.length}
          </span>
        </div>
        <div className={styles.headerActions}>
          {/* Only show Add Card icon button for non-readonly users */}
          {!readOnly && canCollaborate && (
            <button
              className={styles.iconBtn}
              onClick={() => setAddingCard(true)}
              title="Add card"
            >
              <Plus size={16} />
            </button>
          )}
          <button
            className={styles.iconBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            title="List options"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className={styles.menu}>
              {/* Guests only see "View Cards" — no add functionality */}
              {!readOnly && canCollaborate ? (
                <button onClick={() => { setAddingCard(true); setMenuOpen(false); }}>
                  Add Card
                </button>
              ) : (
                <button onClick={() => { setMenuOpen(false); }}>
                  View Cards
                </button>
              )}
              {canCollaborate && !readOnly && (
                <button onClick={() => { setListName(list.name || ''); setEditingName(true); setMenuOpen(false); }}>
                  Edit List Name
                </button>
              )}
              {canCollaborate && !readOnly && (
                <button
                  className={styles.danger}
                  onClick={() => {
                    setMenuOpen(false);
                    deleteList(list.id);
                  }}
                >
                  Delete List
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cards drop zone — Droppable uses list.id (string) as droppableId */}
      <Droppable droppableId={list.id} type="CARD">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`${styles.cardsArea} ${snapshot.isDraggingOver ? styles.dragOver : ''}`}
          >
            {cards.map((card, index) => (
              <Card key={card.id} card={card} index={index} onEdit={onEditCard} readOnly={readOnly} />
            ))}
            {provided.placeholder}

            {/* Inline add card input — only for non-readonly users */}
            {addingCard && !readOnly && canCollaborate && (
              <div className={styles.addCardForm}>
                <textarea
                  autoFocus
                  className={styles.addCardInput}
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter card title..."
                  rows={2}
                />
                <div className={styles.addCardActions}>
                  <button className={styles.addBtn} onClick={handleAddCard}>Add Card</button>
                  <button className={styles.cancelBtn} onClick={() => { setAddingCard(false); setNewCardTitle(''); }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Droppable>

      {/* Add card button (shown when not in adding mode) — only for non-readonly users */}
      {!addingCard && canCollaborate && !readOnly && (
        <button className={styles.addCardBtn} onClick={() => setAddingCard(true)}>
          <Plus size={14} />
          Add a card
        </button>
      )}
    </div>
  );
}
