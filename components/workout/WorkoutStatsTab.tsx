'use client';

import { useState } from 'react';
import { haptic } from '@/lib/haptics';
import { VolumeTab }   from './stats/VolumeTab';
import { StrengthTab } from './stats/StrengthTab';
import { ActivityTab } from './stats/ActivityTab';

type InnerTab = 'volume' | 'strength' | 'activity';

const TABS: { id: InnerTab; label: string }[] = [
  { id: 'volume',   label: 'Объём'      },
  { id: 'strength', label: 'Сила'       },
  { id: 'activity', label: 'Активность' },
];

export function WorkoutStatsTab() {
  const [tab, setTab] = useState<InnerTab>('volume');

  return (
    <div className="flex flex-col gap-4">
      {/* Inner tab selector */}
      <div className="flex gap-1 p-1 mx-4 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { haptic('light'); setTab(t.id); }}
            className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95"
            style={{
              background: tab === t.id ? '#ffffff' : 'transparent',
              color: tab === t.id ? '#0a0a0b' : 'var(--text-4)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'volume'   && <VolumeTab />}
      {tab === 'strength' && <StrengthTab />}
      {tab === 'activity' && <ActivityTab />}
    </div>
  );
}
