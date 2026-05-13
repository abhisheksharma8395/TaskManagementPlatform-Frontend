import { useMemo, useRef, useState } from 'react';
import { Download, FileText, ImageOff, Loader, Paperclip, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import * as commentService from '../../api/commentService';
import styles from './AttachmentUpload.module.css';

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function isImageAttachment(attachment) {
  return attachment.fileType?.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/i.test(attachment.fileName || attachment.fileUrl || '');
}

function isPdfAttachment(attachment) {
  return attachment.fileType === 'application/pdf' || /\.pdf$/i.test(attachment.fileName || attachment.fileUrl || '');
}

function formatSize(sizeKb) {
  if (!sizeKb) return '';
  if (sizeKb >= 1024) return `${(sizeKb / 1024).toFixed(1)} MB`;
  return `${sizeKb} KB`;
}

export default function AttachmentUpload({
  cardId,
  attachments,
  loading,
  readOnly = false,
  onUploaded,
  onDelete,
}) {
  const inputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progressByFile, setProgressByFile] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [brokenImages, setBrokenImages] = useState({});
  const [previewAttachment, setPreviewAttachment] = useState(null);

  const totalProgress = useMemo(() => {
    const values = Object.values(progressByFile);
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [progressByFile]);

  const handleFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    setError('');
    setSuccess('');
    if (!files.length) return;

    const oversized = files.find((file) => file.size > MAX_SIZE_BYTES);
    if (oversized) {
      setError(`${oversized.name} must be ${MAX_SIZE_MB} MB or smaller.`);
      return;
    }

    setSelectedFiles(files);
    setProgressByFile(Object.fromEntries(files.map((file) => [file.name, 0])));
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setProgressByFile({});
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !cardId) return;
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const uploaded = await commentService.uploadAttachments(
        { cardId, files: selectedFiles },
        (fileName, progress) => setProgressByFile((prev) => ({ ...prev, [fileName]: progress })),
      );
      onUploaded(uploaded);
      clearSelection();
      setSuccess(uploaded.length === 1 ? 'Attachment uploaded.' : `${uploaded.length} attachments uploaded.`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to upload attachments.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.attachmentPanel}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Paperclip size={14} />
          <span>Attachments</span>
        </div>
        {!readOnly && (
          <button className={styles.iconBtn} type="button" onClick={() => inputRef.current?.click()} disabled={uploading} title="Choose attachments">
            <Plus size={13} />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        className={styles.fileInput}
        type="file"
        multiple
        onChange={handleFilesSelected}
      />

      {loading && <div className={styles.loadingText}>Loading attachments...</div>}
      {!loading && attachments.length === 0 && <div className={styles.emptyText}>No attachments yet.</div>}

      <div className={styles.grid}>
        {attachments.map((attachment) => {
          const image = isImageAttachment(attachment);
          const pdf = isPdfAttachment(attachment);
          const imageFailed = brokenImages[attachment.attachmentId];

          return (
            <div key={attachment.attachmentId} className={styles.item}>
              <button
                type="button"
                className={styles.previewButton}
                onClick={() => image && !imageFailed ? setPreviewAttachment(attachment) : undefined}
                disabled={!image || imageFailed}
                title={image ? 'Open image preview' : undefined}
              >
                {image && !imageFailed ? (
                  <img
                    className={styles.thumb}
                    src={attachment.fileUrl}
                    alt={attachment.fileName || 'Attachment'}
                    onError={() => setBrokenImages((prev) => ({ ...prev, [attachment.attachmentId]: true }))}
                  />
                ) : pdf ? (
                  <div className={`${styles.fileThumb} ${styles.pdfThumb}`}>PDF</div>
                ) : (
                  <div className={styles.fileThumb}>
                    {imageFailed ? <ImageOff size={20} /> : <FileText size={22} />}
                  </div>
                )}
              </button>
              <div className={styles.meta}>
                <button
                  type="button"
                  className={styles.name}
                  onClick={() => (image || pdf) ? setPreviewAttachment(attachment) : undefined}
                  disabled={!image && !pdf}
                >
                  {attachment.fileName || attachment.fileUrl}
                </button>
                <span className={styles.size}>{formatSize(attachment.sizeKb) || attachment.fileType || 'File'}</span>
              </div>
              {pdf && (
                <button
                  className={styles.previewAction}
                  type="button"
                  onClick={() => setPreviewAttachment(attachment)}
                  title="Preview PDF"
                >
                  Preview
                </button>
              )}
              <a className={styles.actionBtn} href={attachment.fileUrl} download target="_blank" rel="noreferrer" title="Download">
                <Download size={13} />
              </a>
              {!readOnly && (
                <button className={styles.actionBtn} type="button" onClick={() => onDelete(attachment.attachmentId)} title="Delete attachment">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectedFiles.length > 0 && (
        <div className={styles.uploadBox}>
          <div className={styles.selectedHeader}>
            <span>{selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files selected`}</span>
            <button type="button" onClick={clearSelection} disabled={uploading} title="Clear selection">
              <X size={13} />
            </button>
          </div>
          {uploading && (
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${totalProgress}%` }} />
            </div>
          )}
          <div className={styles.uploadActions}>
            <button className={styles.uploadBtn} type="button" onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader size={13} className={styles.spin} /> : <UploadCloud size={13} />}
              {uploading ? `Uploading ${totalProgress}%` : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {success && <p className={styles.success}>{success}</p>}
      {error && <p className={styles.error}>{error}</p>}

      {previewAttachment && (
        <div className={styles.modalOverlay} onClick={() => setPreviewAttachment(null)}>
          <div className={styles.previewModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <strong>{previewAttachment.fileName || 'Attachment preview'}</strong>
              <button type="button" onClick={() => setPreviewAttachment(null)} title="Close preview">
                <X size={16} />
              </button>
            </div>
            {isImageAttachment(previewAttachment) ? (
              <img className={styles.fullImage} src={previewAttachment.fileUrl} alt={previewAttachment.fileName || 'Attachment'} />
            ) : (
              <iframe
                className={styles.pdfFrame}
                src={previewAttachment.viewerUrl || previewAttachment.fileUrl}
                title={previewAttachment.fileName || 'PDF preview'}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
