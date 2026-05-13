import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Board from '../../components/Board/Board';
import { useBoard } from '../../context/BoardContext';

export default function BoardPage() {
  const { boardId } = useParams();
  const {
    boards,
    activeBoardId,
    setActiveBoardId,
    setActiveWorkspaceId,
    fetchBoardMembers,
    fetchBoards,
  } = useBoard();

  useEffect(() => {
    if (!boardId) return;
    setActiveBoardId(String(boardId));
  }, [boardId, setActiveBoardId]);

  useEffect(() => {
    const selected = boards.find((board) => board.id === String(boardId));
    if (!selected) return;
    setActiveWorkspaceId(selected.workspaceId);
    fetchBoardMembers(selected.id).catch(() => {});
  }, [boardId, boards, fetchBoardMembers, setActiveWorkspaceId]);

  useEffect(() => {
    const selected = boards.find((board) => board.id === String(boardId));
    if (!selected?.workspaceId) return;
    fetchBoards(selected.workspaceId).catch(() => {});
  }, [boardId, boards, fetchBoards]);

  return <Board />;
}
