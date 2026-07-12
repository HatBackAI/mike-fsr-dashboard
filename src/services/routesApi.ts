import { ApiError, del, get, patch, post } from 'aws-amplify/api';
import { API_FIELDS } from '../config/apiFields';
import { useMockApi } from '../config/amplify';
import { sanitizedMockRoutes } from '../data/mockRoutes';
import type { FsrRoute, RouteDraft } from '../types';

const apiName = import.meta.env.VITE_API_NAME ?? 'MikeFsrAdmin';
const storageKey = 'mike-fsr-dashboard-routes-v1';

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readFirst(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function normalizeRecord(record: Record<string, unknown>): FsrRoute {
  return {
    kitId: String(readFirst(record, [API_FIELDS.kitId, 'kitId']) ?? ''),
    routeOrder: toNumber(readFirst(record, [API_FIELDS.routeOrder, 'routeOrder'])),
    fsrName: String(
      readFirst(record, [API_FIELDS.fsrName, 'name', 'display_name', 'fsrName']) ?? '',
    ),
    phoneNumber: String(
      readFirst(record, [API_FIELDS.phoneNumber, 'phone', 'phoneNumber']) ?? '',
    ),
    active: toBoolean(readFirst(record, [API_FIELDS.active, 'is_active']), true),
    onCall: toBoolean(readFirst(record, [API_FIELDS.onCall, 'onCall']), false),
    archived: toBoolean(readFirst(record, [API_FIELDS.archived]), false),
    updatedAt: String(readFirst(record, ['updated_at', 'updatedAt']) ?? ''),
    raw: record,
  };
}

function toApiBody(route: RouteDraft): Record<string, unknown> {
  return {
    [API_FIELDS.kitId]: route.kitId.trim().toUpperCase(),
    [API_FIELDS.routeOrder]: route.routeOrder,
    [API_FIELDS.fsrName]: route.fsrName.trim(),
    [API_FIELDS.phoneNumber]: route.phoneNumber.trim(),
    [API_FIELDS.active]: route.active,
    [API_FIELDS.onCall]: route.onCall,
  };
}

async function readJsonBody(body: { json: () => Promise<unknown> }): Promise<unknown> {
  return body.json();
}

function extractRecords(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  for (const key of ['routes', 'items', 'data']) {
    if (Array.isArray(record[key])) return record[key] as Record<string, unknown>[];
  }
  return [];
}

function mockRead(): FsrRoute[] {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    localStorage.setItem(storageKey, JSON.stringify(sanitizedMockRoutes));
    return structuredClone(sanitizedMockRoutes);
  }
  return JSON.parse(saved) as FsrRoute[];
}

function mockWrite(routes: FsrRoute[]): void {
  localStorage.setItem(storageKey, JSON.stringify(routes));
}

async function friendlyError(error: unknown): Promise<Error> {
  if (error instanceof ApiError && error.response) {
    const detail = String(error.response.body ?? 'No response body');
    return new Error(`API ${error.response.statusCode}: ${detail}`);
  }
  return error instanceof Error ? error : new Error('Unexpected API error');
}

export async function listRoutes(): Promise<FsrRoute[]> {
  if (useMockApi) {
    return mockRead().filter((route) => !route.archived);
  }

  try {
    const operation = get({ apiName, path: 'routes' });
    const { body } = await operation.response;
    const payload = await readJsonBody(body);
    return extractRecords(payload)
      .map(normalizeRecord)
      .filter((route) => !route.archived);
  } catch (error) {
    throw await friendlyError(error);
  }
}

export async function createRoute(route: RouteDraft): Promise<void> {
  if (useMockApi) {
    const routes = mockRead();
    const duplicate = routes.some(
      (item) =>
        item.kitId === route.kitId.trim().toUpperCase() &&
        item.routeOrder === route.routeOrder &&
        !item.archived,
    );
    if (duplicate) throw new Error('That kit already has a route at this priority.');
    routes.push({ ...route, kitId: route.kitId.trim().toUpperCase(), updatedAt: new Date().toISOString() });
    mockWrite(routes);
    return;
  }

  try {
    const operation = post({
      apiName,
      path: 'routes',
      options: { body: toApiBody(route) as any },
    });
    await operation.response;
  } catch (error) {
    throw await friendlyError(error);
  }
}

export async function updateRoute(
  original: Pick<FsrRoute, 'kitId' | 'routeOrder'>,
  route: RouteDraft,
): Promise<void> {
  if (useMockApi) {
    const routes = mockRead();
    const index = routes.findIndex(
      (item) => item.kitId === original.kitId && item.routeOrder === original.routeOrder,
    );
    if (index < 0) throw new Error('Route was not found.');
    const duplicate = routes.some(
      (item, itemIndex) =>
        itemIndex !== index &&
        !item.archived &&
        item.kitId === route.kitId.trim().toUpperCase() &&
        item.routeOrder === route.routeOrder,
    );
    if (duplicate) throw new Error('That kit already has a route at this priority.');
    routes[index] = {
      ...routes[index],
      ...route,
      kitId: route.kitId.trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    };
    mockWrite(routes);
    return;
  }

  try {
    const operation = patch({
      apiName,
      path: `routes/${encodeURIComponent(original.kitId)}/${original.routeOrder}`,
      options: { body: toApiBody(route) as any },
    });
    await operation.response;
  } catch (error) {
    throw await friendlyError(error);
  }
}

export async function archiveRoute(route: FsrRoute): Promise<void> {
  if (useMockApi) {
    const routes = mockRead().map((item) =>
      item.kitId === route.kitId && item.routeOrder === route.routeOrder
        ? { ...item, active: false, onCall: false, archived: true, updatedAt: new Date().toISOString() }
        : item,
    );
    mockWrite(routes);
    return;
  }

  try {
    const operation = del({
      apiName,
      path: `routes/${encodeURIComponent(route.kitId)}/${route.routeOrder}`,
    });
    await operation.response;
  } catch (error) {
    throw await friendlyError(error);
  }
}
