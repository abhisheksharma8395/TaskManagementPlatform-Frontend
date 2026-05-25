import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../api/authService';
import * as boardService from '../api/boardService';
import * as cardService from '../api/cardService';
import * as listService from '../api/listService';
import * as workspaceService from '../api/workspaceService';
import { useAuth } from './AuthContext';
import {
  canCollaborateOnBoard,
  canCreateBoard,
  canManageBoard,
  canManageWorkspace,
  getBoardRole,
  getWorkspaceRole,
  isPlatformAdmin,
} from '../utils/permissions';

const BoardContext = createContext(null);

const normalizeWorkspace = (workspace) => ({
  ...workspace,
  id: String(workspace.workspaceId ?? workspace.id),
});

const normalizeBoard = (board) => ({
  ...board,
  id: String(board.boardId ?? board.id),
  workspaceId: String(board.workspaceId),
});

const normalizeList = (list, boardId) => ({
  ...list,
  id: String(list.listId ?? list.id),
  boardId: String(boardId ?? list.boardId),
  name: list.name,
  position: list.position ?? 0,
});

const normalizeCard = (card, listId) => ({
  ...card,
  id: String(card.cardId ?? card.id),
  listId: String(listId ?? card.listId),
  boardId: String(card.boardId),
  assigneeId: card.assigneeId != null ? String(card.assigneeId) : null,
  archived: Boolean(card.archived ?? card.isArchived),
  overdue: Boolean(card.overdue ?? card.isOverdue),
});

function sortByPosition(items) {
  return [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export function BoardProvider({ children }) {
  const { user } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [publicWorkspaces, setPublicWorkspaces] = useState([]);
  const [boards, setBoards] = useState([]);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [userProfilesById, setUserProfilesById] = useState({});

  const [workspaceMembersById, setWorkspaceMembersById] = useState({});
  const [boardMembersById, setBoardMembersById] = useState({});

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [assignedBoards, setAssignedBoards] = useState([]);
  // Extra workspace metadata for boards in private workspaces user isn't a workspace-member of
  const [extraWorkspacesById, setExtraWorkspacesById] = useState({});
  const [error, setError] = useState(null);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === String(activeWorkspaceId)) || null,
    [activeWorkspaceId, workspaces],
  );

  const activeBoard = useMemo(
    () => boards.find((board) => board.id === String(activeBoardId)) || null,
    [activeBoardId, boards],
  );

  const getCachedWorkspaceMembers = useCallback(
    (workspaceId) => workspaceMembersById[String(workspaceId)] || [],
    [workspaceMembersById],
  );

  const getCachedBoardMembers = useCallback(
    (boardId) => boardMembersById[String(boardId)] || [],
    [boardMembersById],
  );

  const getCachedUserProfile = useCallback(
    (userId) => userProfilesById[String(userId)] || null,
    [userProfilesById],
  );

  const fetchUserProfile = useCallback(async (userId) => {
    if (userId == null) return null;
    const key = String(userId);
    const cached = userProfilesById[key];
    if (cached) return cached;

    try {
      const profile = await authService.getUserById(userId);
      setUserProfilesById((prev) => ({ ...prev, [key]: profile }));
      return profile;
    } catch {
      return null;
    }
  }, [userProfilesById]);

  const hydrateMemberProfiles = useCallback(async (members) => {
    const list = Array.isArray(members) ? members : [];
    return Promise.all(list.map(async (member) => {
      const profile = await fetchUserProfile(member.userId);
      return {
        ...member,
        fullName: profile?.fullName || member.fullName || '',
        username: profile?.username || member.username || '',
        email: profile?.email || member.email || '',
        avatarUrl: profile?.avatarUrl || member.avatarUrl || '',
      };
    }));
  }, [fetchUserProfile]);

  const hydrateWorkspaceOwners = useCallback(async (workspaceList) => {
    const list = Array.isArray(workspaceList) ? workspaceList : [];
    return Promise.all(list.map(async (workspace) => {
      const ownerProfile = await fetchUserProfile(workspace.ownerId);
      return {
        ...workspace,
        ownerName: ownerProfile?.fullName || ownerProfile?.username || workspace.ownerName || '',
        ownerUsername: ownerProfile?.username || workspace.ownerUsername || '',
        ownerAvatarUrl: ownerProfile?.avatarUrl || workspace.ownerAvatarUrl || '',
      };
    }));
  }, [fetchUserProfile]);

  const fetchWorkspaceMembers = useCallback(async (workspaceId) => {
    if (!workspaceId) return [];
    const members = await workspaceService.getMembers(workspaceId);
    const hydrated = await hydrateMemberProfiles(members);
    setWorkspaceMembersById((prev) => ({ ...prev, [String(workspaceId)]: hydrated }));
    return hydrated;
  }, [hydrateMemberProfiles]);

  const fetchBoardMembers = useCallback(async (boardId) => {
    if (!boardId) return [];
    const members = await boardService.getBoardMembers(boardId);
    const hydrated = await hydrateMemberProfiles(members);
    setBoardMembersById((prev) => ({ ...prev, [String(boardId)]: hydrated }));
    return hydrated;
  }, [hydrateMemberProfiles]);

  const ensureWorkspaceAccess = useCallback(async (workspaceId, { adminOnly = false } = {}) => {
    const workspace = workspaces.find((item) => item.id === String(workspaceId));
    if (!workspace) throw new Error('Workspace not found');
    if (isPlatformAdmin(user)) return workspace;

    const cachedMembers = getCachedWorkspaceMembers(workspaceId);
    const members = cachedMembers.length > 0 ? cachedMembers : await fetchWorkspaceMembers(workspaceId);
    const allowed = adminOnly
      ? canManageWorkspace(user, workspace, members)
      : getWorkspaceRole(workspace, members, user?.userId) !== 'GUEST';

    if (!allowed) {
      throw new Error(adminOnly ? 'Workspace admin access required' : 'Workspace access denied');
    }

    return workspace;
  }, [fetchWorkspaceMembers, getCachedWorkspaceMembers, user, workspaces]);

  const ensureBoardAccess = useCallback(async (boardId, { manage = false, collaborate = false } = {}) => {
    let board = boards.find((item) => item.id === String(boardId)) || null;
    if (!board) {
      const fetched = await boardService.getBoard(boardId);
      board = normalizeBoard(fetched);
      setBoards((prev) => (prev.some((item) => item.id === board.id) ? prev : [...prev, board]));
    }

    if (isPlatformAdmin(user)) return board;

    const cachedMembers = getCachedBoardMembers(boardId);
    const members = cachedMembers.length > 0 ? cachedMembers : await fetchBoardMembers(boardId);

    let allowed = getBoardRole(board, members, user?.userId) !== 'GUEST';
    if (manage) allowed = canManageBoard(user, board, members);
    if (collaborate) allowed = canCollaborateOnBoard(user, board, members);

    if (!allowed) {
      throw new Error(manage ? 'Board admin access required' : 'Board access denied');
    }

    return board;
  }, [boards, fetchBoardMembers, getCachedBoardMembers, user]);

  const fetchWorkspaces = useCallback(async (userId = user?.userId) => {
    if (!userId) return [];
    setLoadingWorkspaces(true);
    setError(null);
    try {
      const [owned, member, publicWorkspaceResults] = await Promise.all([
        workspaceService.getWorkspacesByOwner(userId).catch(() => []),
        workspaceService.getWorkspacesByMember(userId).catch(() => []),
        workspaceService.getPublicWorkspaces().catch(() => []),
      ]);

      const map = new Map();
      [...owned, ...member].forEach((workspace) => {
        const normalized = normalizeWorkspace(workspace);
        map.set(normalized.id, normalized);
      });

      const combined = await hydrateWorkspaceOwners([...map.values()]);
      const publicOnly = await hydrateWorkspaceOwners(publicWorkspaceResults.map(normalizeWorkspace));
      setWorkspaces(combined);
      setPublicWorkspaces(publicOnly);
      setActiveWorkspaceId((prev) => prev ?? combined[0]?.id ?? publicOnly[0]?.id ?? null);
      return { memberWorkspaces: combined, publicWorkspaces: publicOnly };
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load workspaces');
      return { memberWorkspaces: [], publicWorkspaces: [] };
    } finally {
      setLoadingWorkspaces(false);
    }
  }, [hydrateWorkspaceOwners, user?.userId]);

  const createWorkspace = useCallback(async (data) => {
    const created = await workspaceService.createWorkspace(data);
    const normalized = normalizeWorkspace(created);
    setWorkspaces((prev) => [...prev, normalized]);
    setWorkspaceMembersById((prev) => ({
      ...prev,
      [normalized.id]: [
        {
          userId: user?.userId,
          role: 'ADMIN',
          fullName: user?.fullName || '',
          username: user?.username || '',
          email: user?.email || '',
          avatarUrl: user?.avatarUrl || '',
        },
      ],
    }));
    setActiveWorkspaceId(normalized.id);
    return normalized;
  }, [user?.userId]);

  const updateWorkspace = useCallback(async (workspaceId, data) => {
    await ensureWorkspaceAccess(workspaceId, { adminOnly: true });
    const updated = normalizeWorkspace(await workspaceService.updateWorkspace(workspaceId, data));
    setWorkspaces((prev) => prev.map((workspace) => (workspace.id === String(workspaceId) ? { ...workspace, ...updated } : workspace)));
    return updated;
  }, [ensureWorkspaceAccess]);

  const deleteWorkspace = useCallback(async (workspaceId) => {
    await ensureWorkspaceAccess(workspaceId, { adminOnly: true });
    await workspaceService.deleteWorkspace(workspaceId);

    const nextWorkspaces = workspaces.filter((workspace) => workspace.id !== String(workspaceId));
    setWorkspaces(nextWorkspaces);
    setWorkspaceMembersById((prev) => {
      const next = { ...prev };
      delete next[String(workspaceId)];
      return next;
    });

    if (String(activeWorkspaceId) === String(workspaceId)) {
      setActiveWorkspaceId(nextWorkspaces[0]?.id ?? null);
      setActiveBoardId(null);
      setBoards([]);
      setLists([]);
      setCards([]);
    }
  }, [activeWorkspaceId, ensureWorkspaceAccess, workspaces]);

  const inviteMember = useCallback(async (workspaceId, email, role = 'MEMBER') => {
    await ensureWorkspaceAccess(workspaceId, { adminOnly: true });

    const createdMember = await workspaceService.addMember(workspaceId, {
      email,
      role,
    });

    const profile = await fetchUserProfile(createdMember.userId);
    const hydratedMember = {
      ...createdMember,
      fullName: profile?.fullName || '',
      username: profile?.username || '',
      email: profile?.email || email,
      avatarUrl: profile?.avatarUrl || '',
    };

    setWorkspaceMembersById((prev) => ({
      ...prev,
      [String(workspaceId)]: [
        ...(prev[String(workspaceId)] || []),
        hydratedMember,
      ],
    }));

    return hydratedMember;
  }, [ensureWorkspaceAccess, fetchUserProfile]);

  const removeWorkspaceMember = useCallback(async (workspaceId, userId) => {
    await ensureWorkspaceAccess(workspaceId, { adminOnly: true });
    await workspaceService.removeMember(workspaceId, userId);
    setWorkspaceMembersById((prev) => ({
      ...prev,
      [String(workspaceId)]: (prev[String(workspaceId)] || []).filter((member) => String(member.userId) !== String(userId)),
    }));
  }, [ensureWorkspaceAccess]);

  const updateWorkspaceMemberRole = useCallback(async (workspaceId, userId, role) => {
    await ensureWorkspaceAccess(workspaceId, { adminOnly: true });
    const payload = typeof role === 'string' ? { role } : role;
    const updated = await workspaceService.updateMemberRole(workspaceId, userId, payload);
    setWorkspaceMembersById((prev) => ({
      ...prev,
      [String(workspaceId)]: (prev[String(workspaceId)] || []).map((member) => (
        String(member.userId) === String(userId) ? { ...member, ...updated } : member
      )),
    }));
    return updated;
  }, [ensureWorkspaceAccess]);

  const fetchBoards = useCallback(async (workspaceId) => {
    if (!workspaceId) return [];
    setLoadingBoards(true);
    setError(null);
    try {
      const data = await boardService.getBoardsByWorkspace(workspaceId);
      const normalized = data.map(normalizeBoard);
      // Merge: keep assigned boards already in state, add/update workspace boards
      setBoards((prev) => {
        const assignedIds = new Set(prev.filter((b) => b._assigned).map((b) => b.id));
        const incoming = normalized.map((b) => ({ ...b, _assigned: assignedIds.has(b.id) }));
        const otherBoards = prev.filter((b) => !incoming.some((n) => n.id === b.id));
        return [...otherBoards, ...incoming];
      });
      return normalized;
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load boards');
      return [];
    } finally {
      setLoadingBoards(false);
    }
  }, []);

  /**
   * fetchAssignedBoards — calls GET /boards/member/{userId}
   * Returns boards the user is explicitly a member of, including boards
   * inside private workspaces they don't own or belong to as workspace member.
   * These are merged into the global boards state and tracked separately
   * as assignedBoards for the sidebar/dashboard "Shared With Me" section.
   */
  const fetchAssignedBoards = useCallback(async (userId = user?.userId) => {
    if (!userId) return [];
    setLoadingAssigned(true);
    try {
      const data = await boardService.getBoardsByMember(userId).catch(() => []);
      const normalized = Array.isArray(data) ? data.map((b) => ({ ...normalizeBoard(b), _assigned: true })) : [];

      // Merge into global boards state without duplicates
      setBoards((prev) => {
        const map = new Map(prev.map((b) => [b.id, b]));
        normalized.forEach((b) => {
          if (!map.has(b.id)) map.set(b.id, b);
          else map.set(b.id, { ...map.get(b.id), _assigned: true });
        });
        return [...map.values()];
      });

      setAssignedBoards(normalized);

      // For each unique workspaceId not yet in our workspaces state,
      // fetch the workspace so we can show its real name in the UI
      setExtraWorkspacesById((prev) => {
        // Return synchronously — actual fetches happen below
        return prev;
      });

      // Collect workspace IDs we need names for
      const uniqueWsIds = [...new Set(normalized.map((b) => String(b.workspaceId)))];
      const newExtras = {};
      await Promise.all(
        uniqueWsIds.map(async (wsId) => {
          try {
            const ws = await workspaceService.getWorkspace(wsId);
            if (ws) {
              newExtras[wsId] = {
                id: String(ws.workspaceId ?? ws.id ?? wsId),
                name: ws.name || `Workspace ${wsId}`,
                visibility: ws.visibility,
                ownerId: ws.ownerId,
              };
            }
          } catch {
            // Silently skip — workspace may truly be inaccessible
            newExtras[wsId] = { id: wsId, name: `Workspace ${wsId}`, visibility: 'PRIVATE' };
          }
        }),
      );
      setExtraWorkspacesById((prev) => ({ ...prev, ...newExtras }));

      return normalized;
    } catch {
      return [];
    } finally {
      setLoadingAssigned(false);
    }
  }, [user?.userId]);

  const addBoard = useCallback(async (input) => {
    if (!activeWorkspaceId) throw new Error('Select a workspace first');
    const workspace = workspaces.find((item) => item.id === String(activeWorkspaceId));
    const members = getCachedWorkspaceMembers(activeWorkspaceId);
    if (!canCreateBoard(user, workspace, members)) {
      throw new Error('You do not have permission to create boards in this workspace');
    }

    const payload = typeof input === 'string'
      ? { name: input, workspaceId: Number(activeWorkspaceId) }
      : {
          workspaceId: Number(activeWorkspaceId),
          name: input.name,
          description: input.description || '',
          background: input.background || '',
          visibility: input.visibility || 'PRIVATE',
        };

    const created = normalizeBoard(await boardService.createBoard(payload));
    setBoards((prev) => [...prev, created]);
    setBoardMembersById((prev) => ({
      ...prev,
      [created.id]: [
        {
          userId: user?.userId,
          role: 'ADMIN',
          fullName: user?.fullName || '',
          username: user?.username || '',
          email: user?.email || '',
          avatarUrl: user?.avatarUrl || '',
        },
      ],
    }));
    return created;
  }, [activeWorkspaceId, getCachedWorkspaceMembers, user, workspaces]);

  const updateBoard = useCallback(async (boardId, data) => {
    await ensureBoardAccess(boardId, { manage: true });
    const updated = normalizeBoard(await boardService.updateBoard(boardId, data));
    setBoards((prev) => prev.map((board) => (board.id === String(boardId) ? { ...board, ...updated } : board)));
    return updated;
  }, [ensureBoardAccess]);

  const deleteBoard = useCallback(async (boardId) => {
    await ensureBoardAccess(boardId, { manage: true });
    await boardService.deleteBoard(boardId);

    setBoards((prev) => prev.filter((board) => board.id !== String(boardId)));
    setLists((prev) => prev.filter((list) => list.boardId !== String(boardId)));
    setCards((prev) => prev.filter((card) => card.boardId !== String(boardId)));

    if (String(activeBoardId) === String(boardId)) {
      setActiveBoardId(null);
    }
  }, [activeBoardId, ensureBoardAccess]);

  const closeBoard = useCallback(async (boardId) => {
    await ensureBoardAccess(boardId, { manage: true });
    const updated = normalizeBoard(await boardService.closeBoard(boardId));
    setBoards((prev) => prev.map((board) => (board.id === String(boardId) ? { ...board, ...updated } : board)));
    return updated;
  }, [ensureBoardAccess]);

  const addBoardMember = useCallback(async (boardId, userId, role = 'MEMBER') => {
    await ensureBoardAccess(boardId, { manage: true });
    const created = await boardService.addBoardMember(boardId, { userId, role });
    const profile = await fetchUserProfile(userId);
    const hydratedMember = {
      ...created,
      fullName: profile?.fullName || '',
      username: profile?.username || '',
      email: profile?.email || '',
      avatarUrl: profile?.avatarUrl || '',
    };
    setBoardMembersById((prev) => ({
      ...prev,
      [String(boardId)]: [...(prev[String(boardId)] || []), hydratedMember],
    }));
    return hydratedMember;
  }, [ensureBoardAccess, fetchUserProfile]);

  const removeBoardMember = useCallback(async (boardId, userId) => {
    await ensureBoardAccess(boardId, { manage: true });
    await boardService.removeBoardMember(boardId, userId);
    setBoardMembersById((prev) => ({
      ...prev,
      [String(boardId)]: (prev[String(boardId)] || []).filter((member) => String(member.userId) !== String(userId)),
    }));
  }, [ensureBoardAccess]);

  const updateBoardMemberRole = useCallback(async (boardId, userId, role) => {
    await ensureBoardAccess(boardId, { manage: true });
    const payload = typeof role === 'string' ? { role } : role;
    const updated = await boardService.updateBoardMemberRole(boardId, userId, payload);
    setBoardMembersById((prev) => ({
      ...prev,
      [String(boardId)]: (prev[String(boardId)] || []).map((member) => (
        String(member.userId) === String(userId) ? { ...member, ...updated } : member
      )),
    }));
    return updated;
  }, [ensureBoardAccess]);

  const fetchLists = useCallback(async (boardId) => {
    if (!boardId) return [];
    setLoadingLists(true);
    setError(null);
    try {
      const data = await listService.getListsByBoard(boardId);
      const normalized = data.map((item) => normalizeList(item, boardId));
      setLists((prev) => [
        ...prev.filter((item) => item.boardId !== String(boardId)),
        ...normalized,
      ]);
      return normalized;
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load lists');
      return [];
    } finally {
      setLoadingLists(false);
    }
  }, []);

  const addList = useCallback(async (boardId, name) => {
    await ensureBoardAccess(boardId, { collaborate: true });
    const created = normalizeList(await listService.createList({
      boardId: Number(boardId),
      name,
    }), boardId);
    setLists((prev) => [...prev, created]);
    return created;
  }, [ensureBoardAccess]);

  const updateList = useCallback(async (listId, updates) => {
    const list = lists.find((item) => item.id === String(listId));
    await ensureBoardAccess(list?.boardId, { collaborate: true });
    const updated = normalizeList(await listService.updateList(listId, {
      name: updates.name ?? list?.name,
      color: updates.color ?? list?.color,
    }), list?.boardId);
    setLists((prev) => prev.map((item) => (
      item.id === String(listId) ? { ...item, ...updated } : item
    )));
    return updated;
  }, [ensureBoardAccess, lists]);

  const deleteList = useCallback(async (listId) => {
    const list = lists.find((item) => item.id === String(listId));
    await ensureBoardAccess(list?.boardId, { collaborate: true });
    await listService.archiveList(listId);
    await listService.deleteList(listId);
    setLists((prev) => prev.filter((item) => item.id !== String(listId)));
    setCards((prev) => prev.filter((card) => card.listId !== String(listId)));
  }, [ensureBoardAccess, lists]);

  const reorderBoardLists = useCallback(async (boardId, orderedListIds) => {
    await ensureBoardAccess(boardId, { collaborate: true });
    await listService.reorderLists(boardId, {
      orderedListIds: orderedListIds.map((id) => Number(id)),
    });
    setLists((prev) => {
      const boardLists = prev.filter((list) => list.boardId === String(boardId));
      const otherLists = prev.filter((list) => list.boardId !== String(boardId));
      const reordered = orderedListIds
        .map((listId, index) => {
          const match = boardLists.find((list) => list.id === String(listId));
          return match ? { ...match, position: index } : null;
        })
        .filter(Boolean);
      return [...otherLists, ...reordered];
    });
  }, [ensureBoardAccess]);

  const fetchCards = useCallback(async (listId) => {
    if (!listId) return [];
    setLoadingCards(true);
    setError(null);
    try {
      const data = await cardService.getCardsByList(listId);
      const normalized = data.map((item) => normalizeCard(item, listId));
      setCards((prev) => [
        ...prev.filter((card) => card.listId !== String(listId)),
        ...normalized,
      ]);
      return normalized;
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load cards');
      return [];
    } finally {
      setLoadingCards(false);
    }
  }, []);

  const addCard = useCallback(async (listIdOrPayload, title, boardId) => {
    const payload = typeof listIdOrPayload === 'object'
      ? listIdOrPayload
      : {
          listId: Number(listIdOrPayload),
          boardId: Number(boardId ?? activeBoardId),
          title,
        };

    await ensureBoardAccess(payload.boardId, { collaborate: true });

    const created = normalizeCard(await cardService.createCard(payload), payload.listId);
    setCards((prev) => [...prev, created]);
    return created;
  }, [activeBoardId, ensureBoardAccess]);

  const updateCard = useCallback(async (cardId, updates) => {
    const card = cards.find((item) => item.id === String(cardId));
    await ensureBoardAccess(card?.boardId, { collaborate: true });
    const updated = normalizeCard(await cardService.updateCard(cardId, updates), card?.listId);
    // Merge `updates` last so explicitly-cleared fields (e.g. startDate: null, dueDate: null)
    // always override whatever the backend returns in its response.
    setCards((prev) => prev.map((item) => (item.id === String(cardId) ? { ...item, ...updated, ...updates } : item)));
    return updated;
  }, [cards, ensureBoardAccess]);

  const setCardAssignee = useCallback(async (cardId, user) => {
    const card = cards.find((item) => item.id === String(cardId));
    await ensureBoardAccess(card?.boardId, { collaborate: true });
    const fullName = user ? (user.fullName || user.username || (typeof user === 'string' ? user : null)) : null;
    const email = user && typeof user === 'object' ? user.email : null;
    const updated = normalizeCard(
      await cardService.setAssignee(cardId, { fullName, email }),
      card?.listId,
    );
    setCards((prev) => prev.map((item) => (item.id === String(cardId) ? { ...item, ...updated } : item)));
    return updated;
  }, [cards, ensureBoardAccess]);

  const deleteCard = useCallback(async (cardId) => {
    const card = cards.find((item) => item.id === String(cardId));
    await ensureBoardAccess(card?.boardId, { collaborate: true });

    // Optimistic removal so the UI feels instant
    setCards((prev) => prev.filter((item) => item.id !== String(cardId)));

    try {
      // Archive step is required by backend before permanent delete.
      // Silently ignore if it fails (e.g. already archived, endpoint unavailable).
      try { await cardService.archiveCard(cardId); } catch { /* already archived / no-op */ }
      await cardService.deleteCard(cardId);
    } catch (err) {
      // Revert optimistic removal if the hard delete itself failed
      if (card) setCards((prev) => [...prev, card]);
      throw err;
    }
  }, [cards, ensureBoardAccess]);

  const moveCard = useCallback(async (cardId, destinationListId, destinationIndex) => {
    const card = cards.find((item) => item.id === String(cardId));
    await ensureBoardAccess(card?.boardId, { collaborate: true });

    setCards((prev) => {
      const movingCard = prev.find((item) => item.id === String(cardId));
      if (!movingCard) return prev;

      const withoutMoving = prev.filter((item) => item.id !== String(cardId));
      const destinationCards = sortByPosition(withoutMoving.filter((item) => item.listId === String(destinationListId)));
      destinationCards.splice(destinationIndex, 0, { ...movingCard, listId: String(destinationListId) });
      const normalizedDestination = destinationCards.map((item, index) => ({ ...item, position: index }));
      const remaining = withoutMoving.filter((item) => item.listId !== String(destinationListId));
      return [...remaining, ...normalizedDestination];
    });

    await cardService.moveCard(cardId, {
      targetListId: Number(destinationListId),
      position: destinationIndex,
    });
  }, [cards, ensureBoardAccess]);

  const getListCards = useCallback((listId) => sortByPosition(
    cards.filter((card) => card.listId === String(listId)),
  ), [cards]);

  const getBoardLists = useCallback((boardId) => sortByPosition(
    lists.filter((list) => list.boardId === String(boardId)),
  ), [lists]);

  const getWorkspaceBoards = useCallback((workspaceId) => boards.filter(
    (board) => board.workspaceId === String(workspaceId),
  ), [boards]);

  const getCurrentWorkspaceRole = useCallback((workspaceId = activeWorkspaceId) => {
    const workspace = workspaces.find((item) => item.id === String(workspaceId));
    return getWorkspaceRole(workspace, getCachedWorkspaceMembers(workspaceId), user?.userId);
  }, [activeWorkspaceId, getCachedWorkspaceMembers, user?.userId, workspaces]);

  const getCurrentBoardRole = useCallback((boardId = activeBoardId) => {
    const board = boards.find((item) => item.id === String(boardId));
    return getBoardRole(board, getCachedBoardMembers(boardId), user?.userId);
  }, [activeBoardId, boards, getCachedBoardMembers, user?.userId]);

  useEffect(() => {
    if (user?.userId) {
      fetchWorkspaces(user.userId);
      fetchAssignedBoards(user.userId);
    }
  }, [fetchWorkspaces, fetchAssignedBoards, user?.userId]);

  useEffect(() => {
    if (activeBoardId) {
      fetchLists(activeBoardId);
      fetchBoardMembers(activeBoardId).catch(() => {});
    }
  }, [activeBoardId, fetchBoardMembers, fetchLists]);

  useEffect(() => {
    const boardLists = lists.filter((list) => list.boardId === String(activeBoardId));
    boardLists.forEach((list) => {
      fetchCards(list.id).catch(() => {});
    });
  }, [activeBoardId, fetchCards, lists]);

  return (
    <BoardContext.Provider
      value={{
        workspaces,
        publicWorkspaces,
        boards,
        lists,
        cards,
        workspaceMembersById,
        boardMembersById,
        activeWorkspaceId,
        setActiveWorkspaceId,
        activeBoardId,
        setActiveBoardId,
        activeView,
        setActiveView,
        activeWorkspace,
        activeBoard,
        assignedBoards,
        extraWorkspacesById,
        loadingWorkspaces,
        loadingBoards,
        loadingLists,
        loadingCards,
        loadingAssigned,
        error,
        setError,
        fetchWorkspaces,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        fetchWorkspaceMembers,
        inviteMember,
        removeWorkspaceMember,
        updateWorkspaceMemberRole,
        fetchBoards,
        fetchAssignedBoards,
        addBoard,
        updateBoard,
        deleteBoard,
        closeBoard,
        fetchBoardMembers,
        addBoardMember,
        removeBoardMember,
        updateBoardMemberRole,
        fetchLists,
        addList,
        updateList,
        deleteList,
        reorderBoardLists,
        fetchCards,
        addCard,
        updateCard,
        setCardAssignee,
        deleteCard,
        moveCard,
        getListCards,
        getBoardLists,
        getWorkspaceBoards,
        getCachedWorkspaceMembers,
        getCachedBoardMembers,
        getCachedUserProfile,
        fetchUserProfile,
        getCurrentWorkspaceRole,
        getCurrentBoardRole,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoard must be used within BoardProvider');
  return ctx;
}
