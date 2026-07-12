import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Archive,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Eye,
  EyeOff,
  Gauge,
  Headphones,
  LayoutDashboard,
  Pencil,
  Plus,
  RefreshCw,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { signOut } from 'aws-amplify/auth';
import { useMockApi } from './config/amplify';
import { archiveRoute, createRoute, listRoutes, updateRoute } from './services/routesApi';
import type { FsrRoute, RouteDraft } from './types';
import { RouteModal } from './components/RouteModal';
import { Toggle } from './components/Toggle';

function maskPhone(phone: string): string {
  if (!phone) return '—';
  if (phone.length < 7) return '••••';
  return `${phone.slice(0, 2)} ••• ••• ${phone.slice(-4)}`;
}

function statusLabel(route: FsrRoute): string {
  if (!route.active) return 'Inactive';
  if (route.onCall) return 'On call';
  return 'Available';
}

function App() {
  const [routes, setRoutes] = useState<FsrRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [showPhones, setShowPhones] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<FsrRoute | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const nextRoutes = await listRoutes();
      setRoutes(nextRoutes.sort((a, b) => a.kitId.localeCompare(b.kitId) || a.routeOrder - b.routeOrder));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load routes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredRoutes = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return routes;
    return routes.filter((route) =>
      [route.kitId, route.fsrName, route.phoneNumber].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query, routes]);

  const metrics = useMemo(() => ({
    total: routes.length,
    active: routes.filter((route) => route.active).length,
    onCall: routes.filter((route) => route.active && route.onCall).length,
    kits: new Set(routes.map((route) => route.kitId)).size,
  }), [routes]);

  const mutate = async (key: string, action: () => Promise<void>, success: string) => {
    setBusyKey(key);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(success);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The route update failed.');
    } finally {
      setBusyKey('');
    }
  };

  const saveRoute = async (draft: RouteDraft) => {
    const key = editingRoute ? `${editingRoute.kitId}-${editingRoute.routeOrder}` : 'new';
    await mutate(
      key,
      () => editingRoute
        ? updateRoute({ kitId: editingRoute.kitId, routeOrder: editingRoute.routeOrder }, draft)
        : createRoute(draft),
      editingRoute ? 'FSR route updated.' : 'FSR route added.',
    );
    setModalOpen(false);
    setEditingRoute(null);
  };

  const quickUpdate = (route: FsrRoute, patchValues: Partial<RouteDraft>, success: string) => {
    const draft: RouteDraft = {
      kitId: route.kitId,
      routeOrder: route.routeOrder,
      fsrName: route.fsrName,
      phoneNumber: route.phoneNumber,
      active: route.active,
      onCall: route.onCall,
      ...patchValues,
    };
    return mutate(
      `${route.kitId}-${route.routeOrder}`,
      () => updateRoute({ kitId: route.kitId, routeOrder: route.routeOrder }, draft),
      success,
    );
  };

  const moveRoute = async (route: FsrRoute, direction: -1 | 1) => {
    const targetOrder = route.routeOrder + direction;
    if (targetOrder < 1) return;
    const target = routes.find((item) => item.kitId === route.kitId && item.routeOrder === targetOrder);
    if (target) {
      setError('This API uses route_order as a DynamoDB key. Swap support must be confirmed in the Lambda before moving two occupied priorities.');
      return;
    }
    await quickUpdate(route, { routeOrder: targetOrder }, `Route priority changed to ${targetOrder}.`);
  };

  const confirmArchive = async (route: FsrRoute) => {
    const confirmed = window.confirm(`Archive ${route.fsrName} for ${route.kitId}? This disables the route but does not hard-delete it.`);
    if (!confirmed) return;
    await mutate(
      `${route.kitId}-${route.routeOrder}`,
      () => archiveRoute(route),
      'FSR route archived.',
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Bot size={22} /></div>
          <div><strong>MIKE</strong><span>Operations Console</span></div>
        </div>
        <nav>
          <button><LayoutDashboard size={18} /><span>Overview</span></button>
          <button className="active"><Route size={18} /><span>FSR Routing</span></button>
          <button><Headphones size={18} /><span>Call Activity</span></button>
          <button><Users size={18} /><span>Teams</span></button>
          <button><Gauge size={18} /><span>Analytics</span></button>
          <button><Settings size={18} /><span>Settings</span></button>
        </nav>
        <div className="guardrail-card">
          <ShieldCheck size={18} />
          <div><strong>Deterministic routing</strong><span>FSRs are selected only after the call flow emits an escalation event.</span></div>
        </div>
        <div className="sidebar-footer">
          <span>GCIO · us-east-1</span>
          {!useMockApi && <button type="button" onClick={() => void signOut()}>Sign out</button>}
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Client administration</p>
            <h1>FSR routing</h1>
            <p>Manage the destinations Mike uses after deterministic escalation has already been selected.</p>
          </div>
          <div className="topbar-actions">
            <button className="button button-secondary" type="button" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
            </button>
            <button className="button button-primary" type="button" onClick={() => { setEditingRoute(null); setModalOpen(true); }}>
              <Plus size={17} /> Add FSR
            </button>
          </div>
        </header>

        {useMockApi && (
          <div className="environment-banner"><CircleAlert size={17} /><span>Local demo mode is on. Records are sanitized and stored only in this browser.</span></div>
        )}
        {error && <div className="alert alert-error"><CircleAlert size={18} /><span>{error}</span></div>}
        {notice && <div className="alert alert-success"><CheckCircle2 size={18} /><span>{notice}</span></div>}

        <section className="metrics-grid">
          <article><div className="metric-icon"><Activity size={20} /></div><span>Active routes</span><strong>{metrics.active}</strong><small>{metrics.total} total configured</small></article>
          <article><div className="metric-icon"><Headphones size={20} /></div><span>On-call now</span><strong>{metrics.onCall}</strong><small>Eligible for transfer</small></article>
          <article><div className="metric-icon"><Route size={20} /></div><span>Kit assignments</span><strong>{metrics.kits}</strong><small>Includes DEFAULT fallback</small></article>
          <article><div className="metric-icon"><ShieldCheck size={20} /></div><span>API protection</span><strong>{useMockApi ? 'Demo' : 'IAM'}</strong><small>{useMockApi ? 'No AWS writes' : 'Signed requests only'}</small></article>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div><h2>Routing destinations</h2><p>Lower priority numbers are tried first within each kit.</p></div>
            <div className="table-tools">
              <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search kit or FSR" /></label>
              <button type="button" className="icon-text-button" onClick={() => setShowPhones((value) => !value)}>{showPhones ? <EyeOff size={16} /> : <Eye size={16} />}{showPhones ? 'Hide phones' : 'Show phones'}</button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr><th>Kit</th><th>Priority</th><th>FSR</th><th>Phone</th><th>Status</th><th>On call</th><th>Active</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="empty-state">Loading routes…</td></tr>
                ) : filteredRoutes.length === 0 ? (
                  <tr><td colSpan={8} className="empty-state">No routes match this search.</td></tr>
                ) : filteredRoutes.map((route) => {
                  const key = `${route.kitId}-${route.routeOrder}`;
                  const busy = busyKey === key;
                  return (
                    <tr key={key}>
                      <td><span className={route.kitId === 'DEFAULT' ? 'kit-badge default' : 'kit-badge'}>{route.kitId}</span></td>
                      <td><div className="priority-cell"><strong>{route.routeOrder}</strong><div><button type="button" aria-label="Move priority up" disabled={busy || route.routeOrder <= 1} onClick={() => void moveRoute(route, -1)}><ChevronUp size={14} /></button><button type="button" aria-label="Move priority down" disabled={busy} onClick={() => void moveRoute(route, 1)}><ChevronDown size={14} /></button></div></div></td>
                      <td><div className="name-cell"><div className="avatar">{route.fsrName.slice(0, 2).toUpperCase()}</div><strong>{route.fsrName || 'Unnamed route'}</strong></div></td>
                      <td className="mono">{showPhones ? route.phoneNumber : maskPhone(route.phoneNumber)}</td>
                      <td><span className={`status-pill ${statusLabel(route).toLowerCase().replace(' ', '-')}`}><span />{statusLabel(route)}</span></td>
                      <td><Toggle checked={route.onCall} label={`Set ${route.fsrName} on-call status`} disabled={busy} onChange={(checked) => void quickUpdate(route, { onCall: checked }, checked ? 'Route set on call.' : 'Route removed from on-call rotation.')} /></td>
                      <td><Toggle checked={route.active} label={`Set ${route.fsrName} active status`} disabled={busy} onChange={(checked) => void quickUpdate(route, { active: checked }, checked ? 'Route activated.' : 'Route deactivated.')} /></td>
                      <td><div className="row-actions"><button type="button" className="icon-button" aria-label="Edit route" onClick={() => { setEditingRoute(route); setModalOpen(true); }}><Pencil size={16} /></button><button type="button" className="icon-button danger" aria-label="Archive route" disabled={busy} onClick={() => void confirmArchive(route)}><Archive size={16} /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="panel-footer"><span>{filteredRoutes.length} displayed</span><span>Archive sets active=false, on_call=false, archived=true.</span></div>
        </section>
      </main>

      <RouteModal route={editingRoute} open={modalOpen} busy={busyKey === 'new' || Boolean(editingRoute && busyKey === `${editingRoute.kitId}-${editingRoute.routeOrder}`)} onClose={() => { if (!busyKey) { setModalOpen(false); setEditingRoute(null); } }} onSave={saveRoute} />
    </div>
  );
}

export default App;
