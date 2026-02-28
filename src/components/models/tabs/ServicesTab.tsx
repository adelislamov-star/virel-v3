// SERVICES TAB - Full implementation
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Service {
  id: string;
  title: string;
  slug: string;
  code?: string;
  hasExtraPrice: boolean;
  isPopular: boolean;
}

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  services: Service[];
}

interface ModelServiceState {
  [serviceId: string]: {
    enabled: boolean;
    extraPrice: string;
  };
}

export default function ServicesTab({ model, onSave, saving }: any) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [serviceState, setServiceState] = useState<ModelServiceState>({});
  const [loadingServices, setLoadingServices] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (model?.services && categories.length > 0) {
      initModelServices();
    }
  }, [model, categories]);

  async function loadServices() {
    try {
      const res = await fetch('/api/v1/services');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data.categories || []);
      }
    } catch (e) {
      console.error('Failed to load services', e);
    } finally {
      setLoadingServices(false);
    }
  }

  function initModelServices() {
    const state: ModelServiceState = {};
    // Pre-populate from model's existing services
    if (model.services) {
      model.services.forEach((ms: any) => {
        state[ms.serviceId] = {
          enabled: ms.isEnabled,
          extraPrice: ms.extraPrice ? String(ms.extraPrice) : '',
        };
      });
    }
    setServiceState(state);
  }

  function toggleService(serviceId: string) {
    setServiceState(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        enabled: !prev[serviceId]?.enabled,
      }
    }));
  }

  function setExtraPrice(serviceId: string, price: string) {
    setServiceState(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        extraPrice: price,
      }
    }));
  }

  function handleSave() {
    const services = Object.entries(serviceState)
      .filter(([, v]) => v.enabled)
      .map(([serviceId, v]) => ({
        serviceId,
        isEnabled: true,
        extraPrice: v.extraPrice ? parseFloat(v.extraPrice) : null,
      }));
    onSave({ services });
  }

  function getEnabledCount() {
    return Object.values(serviceState).filter(v => v.enabled).length;
  }

  if (loadingServices) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading services...
        </CardContent>
      </Card>
    );
  }

  const filteredCategories = categories.map(cat => ({
    ...cat,
    services: (cat.services || []).filter(s =>
      !searchQuery ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(cat => cat.services.length > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Selected: <strong>{getEnabledCount()}</strong> services
            </span>
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-48"
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Services'}
          </Button>
        </CardContent>
      </Card>

      {/* Categories */}
      {filteredCategories.map(category => (
        <Card key={category.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {category.name}
              <Badge variant="secondary" className="text-xs font-normal">
                {(category.services || []).filter(s => serviceState[s.id]?.enabled).length}
                /{(category.services || []).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(category.services || []).map(service => {
                const state = serviceState[service.id];
                const isEnabled = state?.enabled ?? false;

                return (
                  <div
                    key={service.id}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                      isEnabled
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isEnabled ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}>
                      {isEnabled && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Service name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{service.title}</span>
                        {service.isPopular && (
                          <span className="text-xs text-amber-500">★</span>
                        )}
                      </div>
                      {service.code && (
                        <span className="text-xs text-muted-foreground">{service.code}</span>
                      )}
                    </div>

                    {/* Extra price for services that support it */}
                    {service.hasExtraPrice && isEnabled && (
                      <div onClick={e => e.stopPropagation()}>
                        <Input
                          type="number"
                          placeholder="£?"
                          value={state?.extraPrice || ''}
                          onChange={e => setExtraPrice(service.id, e.target.value)}
                          className="w-16 h-7 text-xs px-1"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredCategories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No services found{searchQuery ? ` for "${searchQuery}"` : ''}
          </CardContent>
        </Card>
      )}

      {/* Save button at bottom */}
      <Card>
        <CardContent className="p-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? 'Saving...' : '💾 Save Services'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
