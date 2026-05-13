/**
 * BoardSettingsModal.jsx — Edit board name, description, background, and visibility.
 * Only OWNER/ADMIN can edit. Guests see read-only info.
 * Includes live preview of background changes.
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Settings2, Eye } from 'lucide-react';
import styles from './BoardSettingsModal.module.css';

const PRESET_BACKGROUNDS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f97316, #fb7185)',
  'linear-gradient(135deg, #0f766e, #0ea5e9)',
  'linear-gradient(135deg, #7c3aed, #ec4899)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #1e3a5f, #0f766e)',
  'linear-gradient(135deg, #6d28d9, #3b82f6)',
  '#1f2937',
  '#374151',
  '#7c3aed',
  '#0f766e',
  '#ea580c',
  '#dc2626',
  '#2563eb',
  '#ec4899',
];

export default function BoardSettingsModal({ board, onClose, onSave, canEdit = false }) {
  const [form, setForm] = useState({
    name: board?.name || '',
    description: board?.description || '',
    background: board?.background || '',
    visibility: board?.visibility || 'PRIVATE',
  });
  const [saving, setSaving] = useState(false);
  const [customBg, setCustomBg] = useState('');

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

  const handleSetCustomBg = () => {
    if (customBg.trim()) {
      setForm((p) => ({ ...p, background: customBg.trim() }));
      setCustomBg('');
    }
  };

  const getPreviewStyle = () => {
    const bg = form.background;
    if (!bg) return { background: 'linear-gradient(135deg, #f97316, #fb7185)' };
    if (bg.startsWith('linear-gradient') || bg.startsWith('#')) return { background: bg };
    return { background: `url(${bg}) center/cover no-repeat` };
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

        {/* Live Preview */}
        <div className={styles.preview} style={getPreviewStyle()}>
          <div className={styles.previewOverlay}>
            <Eye size={16} />
            <span>Live Preview</span>
          </div>
          <h3 className={styles.previewTitle}>{form.name || 'Board Name'}</h3>
          <p className={styles.previewDesc}>{form.description || 'Board description'}</p>
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
              <div className={styles.bgGrid}>
                <button
                  className={`${styles.bgOption} ${!form.background ? styles.bgSelected : ''}`}
                  style={{ background: 'linear-gradient(135deg, #f97316, #fb7185)' }}
                  onClick={() => setForm((p) => ({ ...p, background: '' }))}
                  title="Default"
                />
                {PRESET_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg}
                    className={`${styles.bgOption} ${form.background === bg ? styles.bgSelected : ''}`}
                    style={{ background: bg }}
                    onClick={() => setForm((p) => ({ ...p, background: bg }))}
                  />
                ))}
              </div>
              <div className={styles.customBgRow}>
                <input
                  className={styles.input}
                  value={customBg}
                  onChange={(e) => setCustomBg(e.target.value)}
                  placeholder="Custom color or image URL..."
                />
                <button className={styles.applyBtn} onClick={handleSetCustomBg}>Apply</button>
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
