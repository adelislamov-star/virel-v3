// CONFLICTS BANNER - Priority alerts
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Conflict = {
  type: string;
  bookingId: string;
  booking: {
    id: string;
    startAt: string;
    model?: { name: string };
    client?: { fullName: string };
  };
};

export default function ConflictsBanner({ 
  conflicts,
  onResolve 
}: { 
  conflicts: Conflict[];
  onResolve?: (bookingId: string) => void;
}) {
  
  if (conflicts.length === 0) {
    return (
      <Card className="border-green-500 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold">All Clear!</p>
              <p className="text-sm text-muted-foreground">
                No availability conflicts detected
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-orange-500 bg-orange-50">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-semibold">Action Required</p>
                <Badge variant="destructive">{conflicts.length}</Badge>
              </div>
              
              <div className="space-y-2">
                {conflicts.slice(0, 3).map((conflict, i) => (
                  <div key={i} className="bg-white rounded p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">
                          {conflict.booking.model?.name || 'Model'} - {conflict.booking.client?.fullName || 'Client'}
                        </p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {new Date(conflict.booking.startAt).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs mt-1">
                          {conflict.type === 'no_slot' ? (
                            <span className="text-orange-700">⚠️ No availability slot</span>
                          ) : (
                            <span className="text-red-700">❌ Conflicts with unavailable slot</span>
                          )}
                        </p>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onResolve?.(conflict.bookingId)}
                      >
                        Fix
                      </Button>
                    </div>
                  </div>
                ))}
                
                {conflicts.length > 3 && (
                  <p className="text-sm text-orange-700 pl-3">
                    +{conflicts.length - 3} more conflicts requiring attention
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
