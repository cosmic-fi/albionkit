export interface BanditWindow {
  utcHour: number; // 0-23
  chance: number;  // 0.0 - 1.0
}

export type ServerRegion = 'west' | 'east' | 'europe';

export const BANDIT_SCHEDULES: Record<ServerRegion, BanditWindow[]> = {
  west: [
    { utcHour: 1, chance: 0.6 },
    { utcHour: 3, chance: 0.6 },
    { utcHour: 5, chance: 0.4 },
    { utcHour: 7, chance: 0.2 },
    { utcHour: 11, chance: 0.2 },
    { utcHour: 13, chance: 0.3 },
    { utcHour: 15, chance: 0.3 },
    { utcHour: 17, chance: 0.4 },
    { utcHour: 19, chance: 0.5 },
    { utcHour: 21, chance: 0.5 },
    { utcHour: 23, chance: 0.6 },
  ],
  east: [
    { utcHour: 2, chance: 0.3 },
    { utcHour: 5, chance: 0.3 },
    { utcHour: 7, chance: 0.5 },
    { utcHour: 9, chance: 0.6 },
    { utcHour: 11, chance: 0.4 },
    { utcHour: 13, chance: 0.6 },
    { utcHour: 15, chance: 0.6 },
    { utcHour: 17, chance: 0.6 },
    { utcHour: 19, chance: 0.3 },
    { utcHour: 21, chance: 0.2 },
  ],
  europe: [
    { utcHour: 1, chance: 0.3 },
    { utcHour: 3, chance: 0.2 },
    { utcHour: 5, chance: 0.2 },
    { utcHour: 7, chance: 0.2 },
    { utcHour: 11, chance: 0.4 },
    { utcHour: 13, chance: 0.5 },
    { utcHour: 15, chance: 0.5 },
    { utcHour: 17, chance: 0.6 },
    { utcHour: 19, chance: 0.6 },
    { utcHour: 21, chance: 0.6 },
    { utcHour: 23, chance: 0.5 },
  ]
};
