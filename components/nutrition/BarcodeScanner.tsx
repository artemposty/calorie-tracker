'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { haptic } from '@/lib/haptics';

interface Props {
  /** When true, decode results are ignored and the UI is hidden — but the
   *  camera stream stays alive so resuming doesn't re-trigger a permission
   *  prompt or a fresh getUserMedia handshake. */
  paused: boolean;
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

type ScanState = 'starting' | 'scanning' | 'denied' | 'no-camera' | 'error';
type FocusRing = { x: number; y: number; key: number };

export function BarcodeScanner({ paused, onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const pausedRef = useRef(paused);
  const [state, setState] = useState<ScanState>('starting');
  const [focusRing, setFocusRing] = useState<FocusRing | null>(null);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Camera is requested exactly once per mount — resuming after a scan
  // reuses the same live stream instead of calling getUserMedia again.
  useEffect(() => {
    let cancelled = false;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
    ]);
    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 60,
      delayBetweenScanSuccess: 200,
    });

    (async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
            },
          },
          videoRef.current!,
          (result) => {
            if (result && !cancelled && !pausedRef.current) {
              // Block immediately (synchronously) so a burst of frames
              // right after the hit can't double-fire before the parent's
              // `paused` prop change propagates back down.
              pausedRef.current = true;
              haptic('success');
              onDetected(result.getText());
            }
          },
        );
        if (cancelled) { controls.stop(); return; }
        controlsRef.current = controls;
        setState('scanning');
      } catch (e) {
        if (cancelled) return;
        const name = (e as Error)?.name ?? '';
        if (name === 'NotAllowedError') setState('denied');
        else if (name === 'NotFoundError') setState('no-camera');
        else { console.error('[BarcodeScanner]', e); setState('error'); }
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onDetected]);

  async function handleTapFocus(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusRing({ x, y, key: Date.now() });
    haptic('light');

    const track = (videoRef.current?.srcObject as MediaStream | null)?.getVideoTracks?.()[0];
    if (!track?.getCapabilities) return;
    try {
      const caps = track.getCapabilities() as MediaTrackCapabilities & { focusMode?: string[]; pointsOfInterest?: unknown };
      const nx = x / rect.width;
      const ny = y / rect.height;
      if (caps.focusMode?.includes('single-shot')) {
        await track.applyConstraints({ advanced: [{ focusMode: 'single-shot' } as MediaTrackConstraintSet] });
      } else if (caps.pointsOfInterest && caps.focusMode?.includes('manual')) {
        await track.applyConstraints({ advanced: [{ pointsOfInterest: [{ x: nx, y: ny }] } as unknown as MediaTrackConstraintSet] });
      } else if (caps.focusMode?.includes('continuous')) {
        await track.applyConstraints({ advanced: [{ focusMode: 'manual' } as MediaTrackConstraintSet] });
        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] });
      }
    } catch {
      // unsupported on this device/browser — ignore
    }
  }

  return (
    <div className="fixed inset-0 z-[60]" style={{ background: '#000', display: paused ? 'none' : 'block' }}>
      <div className="absolute inset-0" onClick={handleTapFocus}>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
        />
      </div>

      {/* Tap-to-focus ring */}
      {focusRing && (
        <div
          key={focusRing.key}
          className="absolute pointer-events-none"
          style={{
            left: focusRing.x, top: focusRing.y,
            width: 64, height: 64, marginLeft: -32, marginTop: -32,
            borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.85)',
            animation: 'focus-ring-pulse 0.6s ease-out forwards',
          }}
          onAnimationEnd={() => setFocusRing(null)}
        />
      )}

      {/* Dark overlay with cutout frame — half the visible viewport height */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-5">
        <div
          style={{
            width: '100%', maxWidth: 420, height: '50dvh',
            borderRadius: 20,
            boxShadow: '0 0 0 2000px rgba(0,0,0,0.55)',
            border: '2px solid rgba(255,255,255,0.6)',
          }}
        />
        {state === 'scanning' && (
          <p className="mt-5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Наведи камеру на штрихкод
          </p>
        )}
      </div>

      {/* Status overlays */}
      {(state === 'denied' || state === 'no-camera' || state === 'error') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center gap-3">
          <p className="text-base font-semibold text-white">
            {state === 'denied' && 'Нет доступа к камере'}
            {state === 'no-camera' && 'Камера не найдена'}
            {state === 'error' && 'Не удалось запустить камеру'}
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {state === 'denied' && 'Разреши доступ к камере в настройках браузера и попробуй снова'}
            {state === 'no-camera' && 'На этом устройстве не найдено камеры'}
            {state === 'error' && 'Попробуй ещё раз или добавь продукт вручную'}
          </p>
        </div>
      )}

      {/* Top gradient scrim + close button */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{ height: 110, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
      />
      <button
        onClick={() => { haptic('light'); onClose(); }}
        className="absolute flex items-center justify-center active:scale-90 transition-transform duration-150 ease-out"
        style={{
          top: 'calc(env(safe-area-inset-top, 44px) + 10px)',
          left: 16,
          width: 40, height: 40, borderRadius: 20,
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
        aria-label="Закрыть"
      >
        <svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <style jsx>{`
        @keyframes focus-ring-pulse {
          0%   { transform: scale(1.15); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: scale(0.85); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
