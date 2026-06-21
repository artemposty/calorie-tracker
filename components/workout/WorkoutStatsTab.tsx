'use client';

import { useState } from 'react';
import { haptic } from '@/lib/haptics';
import { DashboardTab } from './stats/DashboardTab';
import { VolumeTab }    from './stats/VolumeTab';
import { StrengthTab }  from './stats/StrengthTab';
import { ActivityTab }  from './stats/ActivityTab';

type InnerTab = 'dashboard' | 'volume' | 'strength' | 'activity';

const TABS: { id: InnerTab; label: string }[] = [
  { id: 'dashboard', label: 'Дашборд'    },
  { id: 'volume',    label: 'Объём'      },
  { id: 'strength',  label: 'Сила'       },
  { id: 'activity',  label: 'Активность' },
];

export function WorkoutStatsTab() {
  const [tab, setTab] = useState<InnerTab>('dashboard');

  return (
    <div className="flex flex-col gap-4">
      {/* Inner tab selector — scrollable to fit 4 tabs */}
      <div className="px-4">
        <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { haptic('light'); setTab(t.id); }}
              className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95 whitespace-nowrap px-2"
              style={{
                background: tab === t.id ? '#ffffff' : 'transparent',
                color: tab === t.id ? '#0a0a0b' : 'var(--text-4)',
                minWidth: 'fit-content',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'volume'    && <VolumeTab />}
      {tab === 'strength'  && <StrengthTab />}
      {tab === 'activity'  && <ActivityTab />}
    </div>
  );
}
