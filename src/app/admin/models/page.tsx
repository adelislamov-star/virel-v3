// MODELS LIST PAGE
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadModels();
  }, []);
  
  async function loadModels() {
    try {
      const res = await fetch('/api/v1/bookings?limit=10');
      const data = await res.json();
      
      // Extract unique models from bookings
      const uniqueModels = new Map();
      data.data?.bookings?.forEach((booking: any) => {
        if (booking.model && !uniqueModels.has(booking.model.id)) {
          uniqueModels.set(booking.model.id, {
            id: booking.model.id,
            publicCode: booking.model.publicCode || 'N/A',
            name: booking.model.name,
            status: 'active',
            visibility: 'public',
            ratingInternal: 4.9
          });
        }
      });
      
      setModels(Array.from(uniqueModels.values()));
      setLoading(false);
    } catch (error) {
      console.error('Failed to load models:', error);
      setLoading(false);
    }
  }
  
  if (loading) {
    return <div className="p-6">Loading models...</div>;
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">👤 Models</h1>
        <p className="text-muted-foreground">
          {models.length} total models
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map(model => (
          <Card key={model.id}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-xl">{model.name}</h3>
                  <p className="text-sm text-muted-foreground">{model.publicCode}</p>
                </div>
                
                <div className="flex gap-2">
                  <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                    {model.status}
                  </Badge>
                  <Badge variant="outline">
                    {model.visibility}
                  </Badge>
                </div>
                
                {model.ratingInternal && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Internal Rating: </span>
                    <span className="font-semibold">⭐ {model.ratingInternal}/5</span>
                  </div>
                )}
                
                <button
                  onClick={() => window.location.href = `/admin/models/${model.id}`}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {models.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No models found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
