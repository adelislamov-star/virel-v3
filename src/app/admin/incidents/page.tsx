// INCIDENT MANAGEMENT PAGE
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

type Incident = {
  id: string;
  bookingId?: string;
  booking?: { id: string; shortId?: string };
  reporterType: string;
  reporterClient?: { id: string; fullName: string };
  reporterModel?: { id: string; name: string };
  status: string;
  severity: string;
  description: string;
  resolutionDetails?: string;
  compensationAmount?: number;
  createdAt: string;
};

const STATUS_FILTERS = ['all', 'reported', 'investigating', 'resolved', 'closed'] as const;
const SEVERITY_OPTIONS = ['all', 'critical', 'high', 'medium', 'low'] as const;

function getSeverityColor(severity: string): any {
  const colors: Record<string, string> = { critical: 'destructive', high: 'orange', medium: 'yellow', low: 'secondary' };
  return colors[severity] || 'default';
}

function getStatusColor(status: string): any {
  const colors: Record<string, string> = { reported: 'destructive', investigating: 'yellow', resolved: 'default', closed: 'secondary' };
  return colors[status] || 'default';
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveDetails, setResolveDetails] = useState('');
  const [resolveCompensation, setResolveCompensation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const limit = 20;

  // Create form state
  const [newIncident, setNewIncident] = useState({
    bookingId: '',
    reporterType: 'staff' as string,
    severity: 'medium' as string,
    description: ''
  });

  useEffect(() => { loadIncidents(); }, [statusFilter, severityFilter, page]);

  async function loadIncidents() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      const res = await fetch(`/api/v1/incidents?${params}`);
      const data = await res.json();
      setIncidents(data.data?.incidents || []);
      setTotal(data.data?.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id: string, newStatus: string, extra?: Record<string, unknown>) {
    try {
      setSubmitting(true);
      await fetch(`/api/v1/incidents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, ...extra })
      });
      setResolveId(null);
      setResolveDetails('');
      setResolveCompensation('');
      await loadIncidents();
    } catch (error) {
      console.error('Failed to change status:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function createIncident() {
    if (!newIncident.description.trim()) return;
    try {
      setSubmitting(true);
      await fetch('/api/v1/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: newIncident.bookingId || undefined,
          reporterType: newIncident.reporterType,
          severity: newIncident.severity,
          description: newIncident.description
        })
      });
      setShowCreate(false);
      setNewIncident({ bookingId: '', reporterType: 'staff', severity: 'medium', description: '' });
      await loadIncidents();
    } catch (error) {
      console.error('Failed to create incident:', error);
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  if (loading && incidents.length === 0) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">⚠️ Incident Management</h1>
          <p className="text-muted-foreground">{total} incidents</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          + New Incident
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="mb-6">
          <CardHeader><CardTitle>New Incident</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Booking ID (optional)</label>
                <input
                  type="text"
                  className="w-full rounded-md border p-2 text-sm bg-background"
                  placeholder="BK-12345"
                  value={newIncident.bookingId}
                  onChange={e => setNewIncident({ ...newIncident, bookingId: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Reporter Type</label>
                <select
                  className="w-full rounded-md border p-2 text-sm bg-background"
                  value={newIncident.reporterType}
                  onChange={e => setNewIncident({ ...newIncident, reporterType: e.target.value })}
                >
                  <option value="client">Client</option>
                  <option value="model">Model</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Severity</label>
                <select
                  className="w-full rounded-md border p-2 text-sm bg-background"
                  value={newIncident.severity}
                  onChange={e => setNewIncident({ ...newIncident, severity: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description *</label>
              <textarea
                className="w-full rounded-md border p-2 text-sm bg-background"
                rows={3}
                placeholder="Describe the incident..."
                value={newIncident.description}
                onChange={e => setNewIncident({ ...newIncident, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createIncident} disabled={submitting || !newIncident.description.trim()}>Create</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap items-center">
        <div className="flex gap-2">
          {STATUS_FILTERS.map(s => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
        <select
          className="rounded-md border p-2 text-sm bg-background"
          value={severityFilter}
          onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
        >
          {SEVERITY_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Severity' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {incidents.map(incident => (
          <Card key={incident.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getStatusColor(incident.status)}>
                      {incident.status}
                    </Badge>
                    <Badge variant={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                    <Badge variant="outline">
                      {incident.reporterType}
                    </Badge>
                    {incident.booking?.shortId && (
                      <Badge variant="outline">{incident.booking.shortId}</Badge>
                    )}
                  </div>
                  <p className="text-sm mb-1">
                    {incident.description.length > 80
                      ? incident.description.slice(0, 80) + '...'
                      : incident.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>#{incident.id.slice(0, 8)}</span>
                    {incident.compensationAmount && <span>Compensation: £{incident.compensationAmount}</span>}
                    <span>{formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  {incident.status === 'reported' && (
                    <Button size="sm" disabled={submitting} onClick={() => changeStatus(incident.id, 'investigating')}>
                      Investigate
                    </Button>
                  )}
                  {incident.status === 'investigating' && (
                    <>
                      <Button size="sm" disabled={submitting} onClick={() => setResolveId(incident.id)}>
                        Resolve
                      </Button>
                      <Button size="sm" variant="outline" disabled={submitting} onClick={() => changeStatus(incident.id, 'closed')}>
                        Close
                      </Button>
                    </>
                  )}
                  {incident.status === 'resolved' && (
                    <Button size="sm" variant="outline" disabled={submitting} onClick={() => changeStatus(incident.id, 'closed')}>
                      Close
                    </Button>
                  )}
                </div>
              </div>

              {/* Resolve Form */}
              {resolveId === incident.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <textarea
                    className="w-full rounded-md border p-2 text-sm bg-background"
                    rows={2}
                    placeholder="Resolution details..."
                    value={resolveDetails}
                    onChange={e => setResolveDetails(e.target.value)}
                  />
                  <div className="flex gap-4 items-end">
                    <div>
                      <label className="text-sm font-medium block mb-1">Compensation (£)</label>
                      <input
                        type="number"
                        className="rounded-md border p-2 text-sm bg-background w-32"
                        placeholder="0"
                        value={resolveCompensation}
                        onChange={e => setResolveCompensation(e.target.value)}
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={submitting}
                      onClick={() => changeStatus(incident.id, 'resolved', {
                        resolutionDetails: resolveDetails,
                        compensationAmount: resolveCompensation ? parseFloat(resolveCompensation) : undefined
                      })}
                    >
                      Confirm Resolve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setResolveId(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {incidents.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No incidents found.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
