import type { FsrRoute } from '../types';

export const sanitizedMockRoutes: FsrRoute[] = [
  {
    kitId: 'DEFAULT',
    routeOrder: 1,
    fsrName: 'Primary FSR',
    phoneNumber: '+12025550111',
    active: true,
    onCall: true,
    updatedAt: '2026-07-12T12:30:00Z',
  },
  {
    kitId: 'DEFAULT',
    routeOrder: 2,
    fsrName: 'Backup FSR',
    phoneNumber: '+12025550112',
    active: true,
    onCall: true,
    updatedAt: '2026-07-12T12:30:00Z',
  },
  {
    kitId: 'DPKT054',
    routeOrder: 1,
    fsrName: 'FSR Alpha',
    phoneNumber: '+12025550121',
    active: true,
    onCall: true,
    updatedAt: '2026-07-12T12:20:00Z',
  },
  {
    kitId: 'DPKT054',
    routeOrder: 2,
    fsrName: 'FSR Bravo',
    phoneNumber: '+12025550122',
    active: true,
    onCall: false,
    updatedAt: '2026-07-12T12:10:00Z',
  },
];
