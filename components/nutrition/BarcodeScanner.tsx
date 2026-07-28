'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { haptic } from '@/lib/haptics';

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

type ScanState = 'starting' | 'scanning' | 'denied' | 'no-camera' | 'error';

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [state, setState] = useState<ScanState>('starting');

  useEffect(() => {
    let cancelled = false;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
    ]);
    const reader = new BrowserMultiFormatReader(hints);

    (async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current!,
          (result) => {
            if (result && !cancelled) {
              haptic('success');
              cancelled = true;
              controlsRef.current?.stop();
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

  return (
    <div className="fixed inset-0 z-50" style={{ background: '#000' }}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
      />

      {/* Dark overlay with cutout frame */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div
          style={{
            width: 260, height: 160, borderRadius: 16,
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

      {/* Close button */}
      <button
        onClick={() => { haptic('light'); onClose(); }}
        className="absolute flex items-center justify-center active:scale-90 transition-transform"
        style={{
          top: 'calc(env(safe-area-inset-top, 44px) + 12px)',
          right: 16,
          width: 40, height: 40, borderRadius: 20,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Закрыть"
      >
        <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
