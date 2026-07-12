export interface FsrRoute {
  kitId: string;
  routeOrder: number;
  fsrName: string;
  phoneNumber: string;
  active: boolean;
  onCall: boolean;
  archived?: boolean;
  updatedAt?: string;
  raw?: Record<string, unknown>;
}

export type RouteDraft = Omit<FsrRoute, 'archived' | 'updatedAt' | 'raw'>;
