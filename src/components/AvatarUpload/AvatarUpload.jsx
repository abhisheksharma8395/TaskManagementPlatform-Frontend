import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, ImageOff, Loader, Upload, X } from 'lucide-react';
import * as authService from '../../api/authService';
import styles from './AvatarUpload.module.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function AvatarUpload({ avatarUrl, initials, onUploaded }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [failedImageSrc, setFailedImageSrc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const imageSrc = previewUrl || avatarUrl;
  const imageFailed = Boolean(imageSrc && failedImageSrc === imageSrc);

  const fileLabel = useMemo(() => {
    if (!selectedFile) return 'JPG or PNG, up to 5 MB.';
    return `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(1)} MB)`;
  }, [selectedFile]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl('');
    setFailedImageSrc('');
    setProgress(0);
    setError('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setSuccess('');
    setError('');

    if (!file) return;
    const isAllowedImage = ACCEPTED_TYPES.includes(file.type) || /\.(jpe?g|png)$/i.test(file.name);
    if (!isAllowedImage) {
      setError('Choose a JPG or PNG image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`Image must be ${MAX_SIZE_MB} MB or smaller.`);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    setFailedImageSrc('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);
    setError('');
    setSuccess('');

    try {
      const uploadedUrl = await authService.uploadAvatar(selectedFile, (event) => {
        if (!event.total) return;
        setProgress(Math.round((event.loaded * 100) / event.total));
      });
      onUploaded(uploadedUrl);
      clearSelection();
      setSuccess('Profile picture updated.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.avatarUpload}>
      <div className={styles.previewWrap}>
        {imageSrc && !imageFailed ? (
          <img className={styles.preview} src={imageSrc} alt="Profile" onError={() => setFailedImageSrc(imageSrc)} />
        ) : (
          <div className={styles.placeholder}>
            {imageFailed ? <ImageOff size={18} /> : initials}
          </div>
        )}
        <button
          className={styles.cameraBtn}
          type="button"
          title="Choose profile picture"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Camera size={14} />
        </button>
      </div>

      <div className={styles.details}>
        <p className={styles.label}>Profile Picture</p>
        <p className={styles.hint}>{fileLabel}</p>
        <input
          ref={inputRef}
          className={styles.fileInput}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          onChange={handleFileChange}
        />

        {selectedFile && (
          <div className={styles.actions}>
            <button className={styles.uploadBtn} type="button" onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader size={13} className={styles.spin} /> : <Upload size={13} />}
              {uploading ? `Uploading ${progress}%` : 'Upload'}
            </button>
            <button className={styles.clearBtn} type="button" onClick={clearSelection} disabled={uploading}>
              <X size={13} /> Clear
            </button>
          </div>
        )}

        {success && <p className={styles.success}><Check size={13} /> {success}</p>}
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
