/**
 * BoardSettingsModal.jsx — Edit board name, description, background, and visibility.
 * Only OWNER/ADMIN can edit. Guests see read-only info.
 * Includes live preview of background changes.
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings2 } from 'lucide-react';
import ColorWheelPicker from '../ColorWheelPicker/ColorWheelPicker';
import styles from './BoardSettingsModal.module.css';



export default function BoardSettingsModal({ board, onClose, onSave, canEdit = false }) {
  const [form, setForm] = useState({
    name: board?.name || '',
    description: board?.description || '',
    background: board?.background || '',
    visibility: board?.visibility || 'PRIVATE',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim() || !canEdit) return;
    setSaving(true);
    try {
      await onSave(board.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        background: form.background,
        visibility: form.visibility,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Settings2 size={18} />
            <h2>Board Settings</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Board Name</label>
            <input
              type="text"
              className={styles.input}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Enter board name..."
              disabled={!canEdit}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Add a description..."
              rows={3}
              disabled={!canEdit}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Visibility</label>
            <select
              className={styles.select}
              value={form.visibility}
              onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value }))}
              disabled={!canEdit}
            >
              <option value="PRIVATE">Private</option>
              <option value="PUBLIC">Public</option>
            </select>
          </div>

          {canEdit && (
            <div className={styles.field}>
              <label className={styles.label}>Background</label>
              <div className={styles.colorWheelSection}>
                <ColorWheelPicker
                  value={form.background}
                  onChange={(hex) => setForm((prev) => ({ ...prev, background: hex }))}
                />
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            {canEdit ? 'Cancel' : 'Close'}
          </button>
          {canEdit && (
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
