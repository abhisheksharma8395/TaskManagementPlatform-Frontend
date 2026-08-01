/**
 * Logo.jsx
 * Reusable FlowBoard logo — uses the SVG from /public/logo.svg
 * Props:
 *   size  – pixel size of the logo image (default 32)
 *   showText – whether to render the "FlowBoard" wordmark (default true)
 *   textClass – optional extra className for the text span
 */
import styles from './Logo.module.css';

export default function Logo({ size = 32, showText = true, className = '', textClass = '' }) {
  return (
    <span className={`${styles.logo} ${className}`}>
      <img
        src="/logo.svg"
        alt="FlowBoard logo"
        width={size}
        height={size}
        className={styles.img}
      />
      {showText && (
        <span className={`${styles.wordmark} ${textClass}`}>FlowBoard</span>
      )}
    </span>
  );
}
