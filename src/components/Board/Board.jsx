import { useMemo, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { MoreHorizontal, Plus, Settings2, Trash2, Users, X } from 'lucide-react';
import * as authService from '../../api/authService';
import { useAuth } from '../../context/AuthContext';
import { useBoard } from '../../context/BoardContext';
import {
  canCollaborateOnBoard,
  canEditBoard,
  canManageBoard,
  getBoardRole,
  isGuestOnBoard,
  getRoleLabel,
  getRoleBadgeColor,
} from '../../utils/permissions';
import Avatar from '../Avatar/Avatar';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import BoardSettingsModal from '../BoardSettings/BoardSettingsModal';
import CardModal from '../CardModal/CardModal';
import List from '../List/List';
import styles from './Board.module.css';

export default function Board() {
  const { user } = useAuth();
  const {
    activeBoardId,
    boards,
    cards,
    getBoardLists,
    addList,
    moveCard,
    reorderBoardLists,
    loadingLists,
    error,
    setError,
    deleteBoard,
    closeBoard,
    updateBoard,
    fetchBoardMembers,
    addBoardMember,
    removeBoardMember,
    updateBoardMemberRole,
    getCachedBoardMembers,
    workspaces,
  } = useBoard();

  const lists = getBoardLists(activeBoardId);
  const activeBoard = boards.find((board) => board.id === activeBoardId) || null;
  const boardMembers = getCachedBoardMembers(activeBoardId);
  const boardRole = getBoardRole(activeBoard, boardMembers, user?.userId);
  
  const workspace = activeBoard ? workspaces.find((w) => String(w.id) === String(activeBoard.workspaceId)) : null;
  const isWorkspaceOwner = workspace && String(workspace.ownerId) === String(user?.userId);
  
  const isGuest = isGuestOnBoard(user, activeBoard, boardMembers) && !isWorkspaceOwner;
  const canCollaborate = (canCollaborateOnBoard(user, activeBoard, boardMembers) || isWorkspaceOwner) && !activeBoard?.isClosed;
  const canManage = canManageBoard(user, activeBoard, boardMembers) || isWorkspaceOwner;
  const canEdit = canEditBoard(user, activeBoard, boardMembers) || isWorkspaceOwner;

  const [editingCard, setEditingCard] = useState(null);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const searchTimeout = useRef(null);

  // Confirmation modals
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null);
  const [deletingBoard, setDeletingBoard] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);

  const boardSummary = useMemo(() => ({
    cardCount: lists.reduce((count, list) => count + (list.cardCount || 0), 0),
    listCount: lists.length,
  }), [lists]);

  const handleDragEnd = (result) => {
    if (isGuest) return; // Guests cannot drag
    const { draggableId, destination, source, type } = result;
    if (!destination) return;

    if (type === 'LIST') {
      if (destination.index === source.index) return;
      const ordered = [...lists];
      const [moved] = ordered.splice(source.index, 1);
      ordered.splice(destination.index, 0, moved);
      reorderBoardLists(activeBoardId, ordered.map((list) => list.id)).catch(() => {});
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    moveCard(draggableId, destination.droppableId, destination.index).catch(() => {});
  };

  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    try {
      await addList(activeBoardId, newListTitle.trim());
      setNewListTitle('');
      setAddingList(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Failed to add list');
    }
  };

  const openMembers = async () => {
    setMenuOpen(false);
    setShowMembers(true);
    setMembersLoading(true);
    try {
      const data = await fetchBoardMembers(activeBoardId);
      setMembers(Array.isArray(data) ? data : []);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleMemberSearch = (value) => {
    setMemberSearch(value);
    clearTimeout(searchTimeout.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await authService.searchUsersByName(value);
        setSearchResults(Array.isArray(results) ? results : []);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const handleAddMember = async (candidate) => {
    await addBoardMember(activeBoardId, candidate.userId);
    const freshMembers = await fetchBoardMembers(activeBoardId);
    setMembers(Array.isArray(freshMembers) ? freshMembers : []);
    setMemberSearch('');
    setSearchResults([]);
  };

  const handleRemoveMember = async () => {
    if (!confirmDeleteMember) return;
    setRemovingMember(true);
    try {
      await removeBoardMember(activeBoardId, confirmDeleteMember.userId);
      setMembers((prev) => prev.filter((member) => String(member.userId) !== String(confirmDeleteMember.userId)));
    } finally {
      setRemovingMember(false);
      setConfirmDeleteMember(null);
    }
  };

  const handleRoleChange = async (memberUserId, role) => {
    await updateBoardMemberRole(activeBoardId, memberUserId, role);
    setMembers((prev) => prev.map((member) => (
      String(member.userId) === String(memberUserId) ? { ...member, role } : member
    )));
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput.trim() === activeBoard?.name) {
      setEditingName(false);
      return;
    }
    await updateBoard(activeBoardId, { name: nameInput.trim() });
    setEditingName(false);
  };

  const handleDeleteBoard = async () => {
    setDeletingBoard(true);
    try {
      await deleteBoard(activeBoardId);
    } finally {
      setDeletingBoard(false);
      setConfirmDelete(false);
    }
  };

  const handleBoardSettingsSave = async (boardId, data) => {
    await updateBoard(boardId, data);
  };

  const roleBadge = getRoleBadgeColor(boardRole);

  if (!activeBoard) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>FB</div>
        <h2>No board selected</h2>
        <p>Choose a board from the workspace to view its lists and cards.</p>
      </div>
    );
  }

  return (
    <div
      className={styles.boardWrapper}
      style={{ background: activeBoard?.background || '#f8f9fb' }}
    >
      <div className={styles.toolbar}>
        <div className={styles.boardInfo}>
          {editingName && canEdit ? (
            <input
              autoFocus
              className={styles.nameInput}
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSaveName();
                if (event.key === 'Escape') setEditingName(false);
              }}
            />
          ) : (
            <h1
              className={styles.boardName}
              onClick={() => canEdit && (setNameInput(activeBoard.name), setEditingName(true))}
              style={canEdit ? { cursor: 'pointer' } : { cursor: 'default' }}
            >
              {activeBoard.name}
              {activeBoard.isClosed && <span className={styles.closedBadge}>Closed</span>}
            </h1>
          )}
          <span className={styles.boardMetaText}>
            {boardSummary.listCount} lists · {boardSummary.cardCount} cards
          </span>
          <span className={styles.roleBadgeInline} style={{ background: roleBadge.bg, color: roleBadge.color }}>
            {getRoleLabel(boardRole)}
          </span>
          {error && (
            <span className={styles.errorBanner}>
              {error}
              <button onClick={() => setError(null)}>X</button>
            </span>
          )}
        </div>

        <div className={styles.toolbarActions}>
          <button className={styles.filterBtn} onClick={openMembers}>
            <Users size={14} />
            Members
          </button>

          {canEdit && (
            <button className={styles.filterBtn} onClick={() => setShowSettings(true)}>
              <Settings2 size={14} />
              Board Settings
            </button>
          )}

          {/* Only show New Task button for collaborators, NOT guests */}
          {canCollaborate && (
            <button
              className={styles.newTaskBtn}
              onClick={() => setEditingCard({ listId: lists[0]?.id || '', boardId: activeBoardId })}
              disabled={lists.length === 0}
            >
              <Plus size={15} />
              New Task
            </button>
          )}

          {canManage && (
            <div className={styles.menuWrapper}>
              <button className={styles.menuBtn} onClick={() => setMenuOpen((value) => !value)}>
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <div className={styles.dropdownMenu}>
                  <button onClick={openMembers}>
                    <Users size={14} />
                    Manage Members
                  </button>
                  <button onClick={() => { setShowSettings(true); setMenuOpen(false); }}>
                    <Settings2 size={14} />
                    Board Settings
                  </button>
                  <button onClick={() => { setNameInput(activeBoard.name); setEditingName(true); setMenuOpen(false); }}>
                    <Settings2 size={14} />
                    Rename Board
                  </button>
                  <button onClick={() => { closeBoard(activeBoardId); setMenuOpen(false); }}>
                    <X size={14} />
                    Close Board
                  </button>
                  <button className={styles.dangerItem} onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}>
                    <Trash2 size={14} />
                    Delete Board
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {loadingLists && (
        <div className={styles.loadingBar}>
          <div className={styles.loadingFill} />
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board-lists" type="LIST" direction="horizontal">
          {(provided) => (
            <div className={styles.board} ref={provided.innerRef} {...provided.droppableProps}>
              {lists.map((list, index) => (
                <Draggable key={list.id} draggableId={`list-${list.id}`} index={index} isDragDisabled={isGuest || !canCollaborate}>
                  {(dragProvided) => (
                    <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                      <List list={list} onEditCard={setEditingCard} canCollaborate={canCollaborate} readOnly={isGuest || !canCollaborate} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              {/* Only show Add List for collaborators, NOT guests */}
              {canCollaborate && !isGuest && (
                addingList ? (
                  <div className={styles.newListForm}>
                    <input
                      autoFocus
                      type="text"
                      className={styles.newListInput}
                      value={newListTitle}
                      onChange={(event) => setNewListTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleAddList();
                        if (event.key === 'Escape') setAddingList(false);
                      }}
                      placeholder="List name..."
                    />
                    <div className={styles.newListActions}>
                      <button className={styles.addBtn} onClick={handleAddList}>Add List</button>
                      <button className={styles.cancelBtn} onClick={() => setAddingList(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className={styles.addListBtn} onClick={() => setAddingList(true)}>
                    <Plus size={16} />
                    Add a list
                  </button>
                )
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {editingCard && (
        <CardModal
          card={editingCard.id ? (cards.find((c) => c.id === String(editingCard.id)) || editingCard) : editingCard}
          readOnly={isGuest || !canCollaborate}
          onClose={() => setEditingCard(null)}
        />
      )}

      {/* Board Settings Modal */}
      {showSettings && (
        <BoardSettingsModal
          board={activeBoard}
          canEdit={canEdit}
          onClose={() => setShowSettings(false)}
          onSave={handleBoardSettingsSave}
        />
      )}

      {/* Delete Board Confirmation */}
      <ConfirmModal
        open={confirmDelete}
        title="Delete Board"
        message={`Are you sure you want to permanently delete "${activeBoard?.name}"? All lists and cards will be removed. This action cannot be undone.`}
        confirmLabel="Delete Board"
        variant="danger"
        loading={deletingBoard}
        onConfirm={handleDeleteBoard}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Remove Member Confirmation */}
      <ConfirmModal
        open={!!confirmDeleteMember}
        title="Remove Member"
        message={`Remove ${confirmDeleteMember?.fullName || confirmDeleteMember?.username || 'this user'} from this board?`}
        confirmLabel="Remove"
        variant="danger"
        loading={removingMember}
        onConfirm={handleRemoveMember}
        onCancel={() => setConfirmDeleteMember(null)}
      />

      {showMembers && (
        <div className={styles.panelOverlay} onClick={() => setShowMembers(false)}>
          <div className={styles.membersPanel} onClick={(event) => event.stopPropagation()}>
            <div className={styles.panelHeader}>
              <h3>Board Members</h3>
              <button className={styles.panelClose} onClick={() => setShowMembers(false)}>
                <X size={18} />
              </button>
            </div>

            {canManage && (
              <div className={styles.panelSearch}>
                <div className={styles.searchWrapper}>
                  <input
                    className={styles.searchInput}
                    placeholder="Search users to add..."
                    value={memberSearch}
                    onChange={(event) => handleMemberSearch(event.target.value)}
                  />
                </div>
                {searchLoading && <p className={styles.searchStatus}>Searching...</p>}
                {searchResults.length > 0 && (
                  <div className={styles.searchDropdown}>
                    {searchResults.map((candidate) => (
                      <div key={candidate.userId} className={styles.searchResultItem} onClick={() => handleAddMember(candidate)}>
                        <Avatar
                          src={candidate.avatarUrl}
                          fullName={candidate.fullName}
                          username={candidate.username}
                          userId={candidate.userId}
                          size="sm"
                        />
                        <div>
                          <div className={styles.memberName}>{candidate.fullName || candidate.username}</div>
                          <div className={styles.memberEmail}>{candidate.email}</div>
                        </div>
                        <Plus size={14} className={styles.addIcon} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={styles.membersList}>
              {membersLoading && <p className={styles.searchStatus}>Loading...</p>}
              {members.map((member) => {
                const memberRoleBadge = getRoleBadgeColor(member.role);
                return (
                  <div key={member.userId} className={styles.memberRow}>
                    <Avatar
                      src={member.avatarUrl}
                      fullName={member.fullName}
                      username={member.username}
                      userId={member.userId}
                      size="md"
                    />
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>{member.fullName || member.username || `User ${member.userId}`}</div>
                      <div className={styles.memberEmail}>{member.email || 'Board member'}</div>
                    </div>
                    {canManage ? (
                      <select
                        className={styles.roleSelect}
                        value={member.role || 'MEMBER'}
                        onChange={(event) => handleRoleChange(member.userId, event.target.value)}
                      >
                        <option value="OBSERVER">Observer</option>
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      <span className={styles.roleBadge} style={{ background: memberRoleBadge.bg, color: memberRoleBadge.color }}>
                        {getRoleLabel(member.role)}
                      </span>
                    )}
                    {/* Only OWNER/ADMIN can remove; guests cannot see remove button */}
                    {canManage && String(member.userId) !== String(activeBoard.createdById) && !isGuest && (
                      <button className={styles.removeBtn} onClick={() => setConfirmDeleteMember(member)}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
