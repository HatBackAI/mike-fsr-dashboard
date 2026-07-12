import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import type { FsrRoute, RouteDraft } from '../types';

interface RouteModalProps {
  route?: FsrRoute | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (draft: RouteDraft) => Promise<void>;
}

const emptyDraft: RouteDraft = {
  kitId: 'DEFAULT',
  routeOrder: 1,
  fsrName: '',
  phoneNumber: '',
  active: true,
  onCall: true,
};

export function RouteModal({ route, open, busy, onClose, onSave }: RouteModalProps) {
  const [draft, setDraft] = useState<RouteDraft>(emptyDraft);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(
      route
        ? {
            kitId: route.kitId,
            routeOrder: route.routeOrder,
            fsrName: route.fsrName,
            phoneNumber: route.phoneNumber,
            active: route.active,
            onCall: route.onCall,
          }
        : emptyDraft,
    );
    setError('');
  }, [route, open]);

  if (!open) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!draft.kitId.trim() || !draft.fsrName.trim()) {
      setError('Kit assignment and FSR name are required.');
      return;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(draft.phoneNumber.trim())) {
      setError('Phone number must use E.164 format, for example +12025550123.');
      return;
    }
    if (!Number.isInteger(draft.routeOrder) || draft.routeOrder < 1) {
      setError('Priority must be a whole number of 1 or greater.');
      return;
    }
    await onSave(draft);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="route-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Routing destination</p>
            <h2 id="route-modal-title">{route ? 'Edit FSR route' : 'Add FSR route'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="form-grid">
            <label>
              Kit assignment
              <input
                value={draft.kitId}
                onChange={(event) => setDraft({ ...draft, kitId: event.target.value.toUpperCase() })}
                placeholder="DEFAULT or DPKT054"
                maxLength={40}
              />
            </label>
            <label>
              Priority
              <input
                type="number"
                min="1"
                step="1"
                value={draft.routeOrder}
                onChange={(event) => setDraft({ ...draft, routeOrder: Number(event.target.value) })}
              />
            </label>
            <label className="full-width">
              FSR display name
              <input
                value={draft.fsrName}
                onChange={(event) => setDraft({ ...draft, fsrName: event.target.value })}
                placeholder="Primary FSR"
                maxLength={100}
              />
            </label>
            <label className="full-width">
              Phone number
              <input
                value={draft.phoneNumber}
                onChange={(event) => setDraft({ ...draft, phoneNumber: event.target.value })}
                placeholder="+12025550123"
                inputMode="tel"
              />
              <span className="field-help">E.164 format is required by the backend.</span>
            </label>
          </div>

          <div className="switch-row">
            <label className="checkbox-row">
              <input type="checkbox" checked={draft.onCall} onChange={(event) => setDraft({ ...draft, onCall: event.target.checked })} />
              On call
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
              Active
            </label>
          </div>

          {error && <div className="inline-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose} disabled={busy}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Saving…' : route ? 'Save changes' : 'Add route'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
