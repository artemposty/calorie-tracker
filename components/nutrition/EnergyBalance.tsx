'use client';

import { calcWorkoutKcal, calcExpenditure, calcDeficit, ENERGY_CONFIG } from '@/lib/energy';

interface Props {
  baseTdee: number;
  tonnage: number;  // today's workout tonnage in kg (0 if no workout)
  eaten: number;
}

export function EnergyBalance({ baseTdee, tonnage, eaten }: Props) {
  const workoutKcal  = calcWorkoutKcal(tonnage);
  const expenditure  = calcExpenditure(baseTdee, workoutKcal);
  const deficit      = calcDeficit(expenditure, Math.round(eaten));
  const isDeficit    = deficit >= 0;

  return (
    <div className="px-4">
      <div className="grid grid-cols-2 gap-2">
        {/* Expenditure card */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>
            Расход
          </p>
          <p className="text-2xl font-light tabular-nums" style={{ color: 'var(--text-1)' }}>
            {expenditure.toLocaleString('ru')}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>ккал/день</p>
          {workoutKcal > 0 && (
            <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--text-3)' }}>
              🏋 +{workoutKcal} зал
            </p>
          )}
        </div>

        {/* Deficit / surplus card */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>
            {isDeficit ? 'Дефицит' : 'Профицит'}
          </p>
          <p
            className="text-2xl font-light tabular-nums"
            style={{ color: isDeficit ? 'var(--success)' : 'var(--danger)' }}
          >
            {isDeficit ? '+' : ''}{Math.abs(deficit).toLocaleString('ru')}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>ккал</p>
          {baseTdee === ENERGY_CONFIG.DEFAULT_BASE_TDEE && (
            <p className="text-[10px] mt-2" style={{ color: 'var(--text-4)' }}>
              base TDEE по умолч.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
