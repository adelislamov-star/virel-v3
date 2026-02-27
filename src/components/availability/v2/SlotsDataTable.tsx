// DATA TABLE - All slots with filters
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type TableSlot = {
  id: string;
  model: { name: string };
  startAt: string;
  endAt: string;
  status: string;
  source: string;
  booking?: { id: string; client?: { fullName: string } };
};

export default function SlotsDataTable({ 
  slots,
  onEdit,
  onDelete
}: { 
  slots: TableSlot[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  const filtered = slots.filter(slot => {
    if (statusFilter !== 'all' && slot.status !== statusFilter) return false;
    if (search && !slot.model.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  
  function getStatusBadge(status: string) {
    const variants: any = {
      available: 'default',
      unavailable: 'destructive',
      tentative: 'secondary'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Availability Slots</CardTitle>
          <Badge variant="outline">{filtered.length} slots</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by model name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md bg-background"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="tentative">Tentative</option>
          </select>
          
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
        
        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Model</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Time</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Booking</th>
                  <th className="text-left p-3 font-medium">Source</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(slot => (
                  <tr key={slot.id} className="hover:bg-muted/50">
                    <td className="p-3 font-medium">{slot.model.name}</td>
                    <td className="p-3">
                      {new Date(slot.startAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-3">
                      {new Date(slot.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' '} → {' '}
                      {new Date(slot.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      {getStatusBadge(slot.status)}
                    </td>
                    <td className="p-3">
                      {slot.booking ? (
                        <span className="text-xs">
                          {slot.booking.client?.fullName || 'Booked'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {slot.source}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onEdit?.(slot.id)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onDelete?.(slot.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No slots found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
