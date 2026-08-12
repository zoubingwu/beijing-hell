import type { LocationDefinition, LocationSlot } from '../types';

export const LOCATIONS: readonly LocationDefinition[] = [
  { slot: 1, subway: '建国门', surface: '永安里' },
  { slot: 2, subway: '北京站', surface: '方庄' },
  { slot: 3, subway: '西直门', surface: '海淀大街' },
  { slot: 4, subway: '崇文门', surface: '永定门' },
  { slot: 5, subway: '东直门', surface: '三元西桥' },
  { slot: 6, subway: '复兴门', surface: '府右街' },
  { slot: 7, subway: '积水潭', surface: '亚运村' },
  { slot: 8, subway: '长椿街', surface: '玉泉营' },
  { slot: 9, subway: '公主坟', surface: '翠微路' },
  { slot: 10, subway: '苹果园', surface: '八角西路' },
] as const;

export const LOCATION_BY_SLOT = new Map<LocationSlot, LocationDefinition>(
  LOCATIONS.map((location) => [location.slot, location]),
);
