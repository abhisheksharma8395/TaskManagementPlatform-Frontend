import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Board from '../../components/Board/Board';
import { useBoard } from '../../context/BoardContext';

export default function BoardPage() {
  const { boardId } = useParams();
  const {
    boards,
    setActiveBoardId,
    setActiveWorkspaceId,
    fetchBoardMembers,
    fetchBoards,
  } = useBoard();

  // Keep a stable ref so effects can read current boards without re-running on every boards update
  const boardsRef = useRef(boards);
  useEffect(() => { boardsRef.current = boards; }, [boards]);

  // Set the active board whenever the boardId param changes
  useEffect(() => {
    if (!boardId) return;
    setActiveBoardId(String(boardId));
  }, [boardId, setActiveBoardId]);

  // Sync workspace + fetch members once when the board is first resolved.
  // Using boardId (not boards) as the dependency so this runs only when the
  // route param changes, not on every incremental boards state update.
  useEffect(() => {
    if (!boardId) return;
    // Read from ref — stable, won't cause re-runs
    const selected = boardsRef.current.find((board) => board.id === String(boardId));
    if (!selected) return;
    setActiveWorkspaceId(selected.workspaceId);
    fetchBoardMembers(selected.id).catch(() => {});
    fetchBoards(selected.workspaceId).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, setActiveWorkspaceId, fetchBoardMembers, fetchBoards]);

  return (
    <div className="board-fullbleed">
      <Board />
    </div>
  );
}
