/**
 * ColorWheelPicker.jsx
 * Canvas-based circular colour wheel.
 * - Outer ring: hue spectrum (conic)
 * - Inner disc: hue × saturation × brightness (white centre → saturated → dark edge)
 * - Draggable dot shows current selection
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ColorWheelPicker.module.css';

const SIZE = 240;        // total canvas size (px)
const RING = 22;         // outer hue-ring thickness (px)
const GAP = 3;           // gap between ring and inner disc
const INNER_R = SIZE / 2 - RING - GAP;  // inner disc radius

/* ── helpers ── */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}

/* Draw the wheel once onto the canvas */
function drawWheel(canvas) {
  const ctx = canvas.getContext('2d');
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  // ── outer hue ring ────────────────────────────────────────────────────
  for (let deg = 0; deg < 360; deg++) {
    const a0 = ((deg - 1) * Math.PI) / 180;
    const a1 = ((deg + 1) * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(cx, cy, SIZE / 2 - 1, a0, a1, false);
    ctx.arc(cx, cy, SIZE / 2 - RING, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = `hsl(${deg}, 100%, 50%)`;
    ctx.fill();
  }

  // ── inner disc: hue ───────────────────────────────────────────────────
  for (let deg = 0; deg < 360; deg++) {
    const a0 = ((deg - 0.75) * Math.PI) / 180;
    const a1 = ((deg + 0.75) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, INNER_R, a0, a1);
    ctx.closePath();
    ctx.fillStyle = `hsl(${deg}, 100%, 50%)`;
    ctx.fill();
  }

  // ── white centre → transparent (saturation) ───────────────────────────
  const whiteGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, INNER_R);
  whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
  whiteGrad.addColorStop(0.55, 'rgba(255,255,255,0.55)');
  whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, INNER_R, 0, 2 * Math.PI);
  ctx.fillStyle = whiteGrad;
  ctx.fill();

  // ── dark outer edge (brightness) ─────────────────────────────────────
  const darkGrad = ctx.createRadialGradient(cx, cy, INNER_R * 0.6, cx, cy, INNER_R);
  darkGrad.addColorStop(0, 'rgba(0,0,0,0)');
  darkGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.beginPath();
  ctx.arc(cx, cy, INNER_R, 0, 2 * Math.PI);
  ctx.fillStyle = darkGrad;
  ctx.fill();

  // ── clip everything to a circle ───────────────────────────────────────
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.arc(cx, cy, SIZE / 2 - 1, 0, 2 * Math.PI);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

/* Pick pixel colour at (x, y) → hex string */
function pickColor(canvas, x, y) {
  const ctx = canvas.getContext('2d');
  const px = clamp(Math.round(x), 0, SIZE - 1);
  const py = clamp(Math.round(y), 0, SIZE - 1);
  const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
  return rgbToHex(r, g, b);
}

export default function ColorWheelPicker({ value, onChange }) {
  const canvasRef = useRef(null);
  const [dot, setDot] = useState({ x: SIZE / 2, y: SIZE / 2 }); // canvas coords
  const dragging = useRef(false);

  // Draw once on mount
  useEffect(() => { if (canvasRef.current) drawWheel(canvasRef.current); }, []);

  // Translate client → canvas coords
  const clientToCanvas = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const pick = useCallback((e) => {
    const { x, y } = clientToCanvas(e);
    const hex = pickColor(canvasRef.current, x, y);
    if (hex === '#000000') return; // outside disc (clipped area)
    setDot({ x, y });
    onChange?.(hex);
  }, [clientToCanvas, onChange]);

  const onMouseDown = (e) => { dragging.current = true; pick(e); };
  const onMouseMove = (e) => { if (dragging.current) pick(e); };
  const onMouseUp   = () => { dragging.current = false; };

  return (
    <div className={styles.wrapper}>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        className={styles.canvas}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={pick}
      />
      {/* Picker dot */}
      <div
        className={styles.dot}
        style={{
          left: `${(dot.x / SIZE) * 100}%`,
          top:  `${(dot.y / SIZE) * 100}%`,
          background: value || '#fff',
        }}
      />
      {/* Selected colour swatch */}
      {value && (
        <div className={styles.preview} style={{ background: value }}>
          <span className={styles.previewHex}>{value}</span>
        </div>
      )}
    </div>
  );
}
