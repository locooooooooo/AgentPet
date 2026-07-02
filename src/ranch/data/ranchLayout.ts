import type { RanchPoint } from '../../types';

export interface RanchZone {
  id: 'work' | 'rest' | 'water' | 'plaza' | 'release';
  label: string;
  className: string;
  center: RanchPoint;
}

export const RANCH_ZONES: RanchZone[] = [
  {
    id: 'work',
    label: '工位区',
    className: 'zone-work',
    center: { x: 28, y: 64 }
  },
  {
    id: 'rest',
    label: '休息区',
    className: 'zone-rest',
    center: { x: 22, y: 34 }
  },
  {
    id: 'water',
    label: '饮水区',
    className: 'zone-water',
    center: { x: 78, y: 32 }
  },
  {
    id: 'plaza',
    label: '中央广场',
    className: 'zone-plaza',
    center: { x: 52, y: 48 }
  },
  {
    id: 'release',
    label: '发布台',
    className: 'zone-release',
    center: { x: 76, y: 65 }
  }
];

export const RANCH_WALK_TARGETS = {
  work: { x: 38, y: 60 },
  plaza: { x: 52, y: 48 },
  water: { x: 78, y: 32 },
  release: { x: 76, y: 65 },
  rest: { x: 22, y: 34 }
} satisfies Record<string, RanchPoint>;
