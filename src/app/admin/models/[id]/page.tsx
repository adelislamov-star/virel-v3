// MODEL PROFILE EDIT PAGE
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import BasicInfoTab from '@/components/models/tabs/BasicInfoTab';
import StatsTab from '@/components/models/tabs/StatsTab';
import ServicesTab from '@/components/models/tabs/ServicesTab';
import RatesTab from '@/components/models/tabs/RatesTab';
import AddressTab from '@/components/models/tabs/AddressTab';
import MediaTab from '@/components/models/tabs/MediaTab';

export default function ModelEditPage() {
  const params = useParams();
  const modelId = params.id as string;
  
  const [activeTab, setActiveTab] = useState('info');
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    loadModel();
  }, [modelId]);
  
  async function loadModel() {
    try {
      const res = await fetch(`/api/v1/models/${modelId}`);
      const data = await res.json();
      
      if (data.success) {
        setModel(data.data.model);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load model:', error);
      setLoading(false);
    }
  }
  
  async function saveModel(updates: any) {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('✅ Saved successfully!');
        loadModel();
      } else {
        alert('❌ Error: ' + data.error?.message);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('❌ Save failed');
    } finally {
      setSaving(false);
    }
  }
  
  if (loading) {
    return <div className="p-6">Loading model...</div>;
  }
  
  if (!model) {
    return <div className="p-6">Model not found</div>;
  }
  
  const tabs = [
    { id: 'info', label: '① Basic Info', icon: '📝' },
    { id: 'stats', label: '② Physical Stats', icon: '📏' },
    { id: 'services', label: '③ Services', icon: '✨' },
    { id: 'rates', label: '④ Rates', icon: '💰' },
    { id: 'address', label: '⑤ Address', icon: '📍' },
    { id: 'media', label: '⑥ Media', icon: '📸' },
  ];
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{model.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge>{model.publicCode}</Badge>
            <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
              {model.status}
            </Badge>
            <Badge variant="outline">{model.visibility}</Badge>
          </div>
        </div>
        
        <Button 
          size="lg"
          onClick={() => window.location.href = '/admin/models'}
        >
          ← Back to Models
        </Button>
      </div>
      
      {/* Tabs Navigation */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-accent'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Tab Content */}
      <div>
        {activeTab === 'info' && (
          <BasicInfoTab model={model} onSave={saveModel} saving={saving} />
        )}
        {activeTab === 'stats' && (
          <StatsTab model={model} onSave={saveModel} saving={saving} />
        )}
        {activeTab === 'services' && (
          <ServicesTab model={model} onSave={saveModel} saving={saving} />
        )}
        {activeTab === 'rates' && (
          <RatesTab model={model} onSave={saveModel} saving={saving} />
        )}
        {activeTab === 'address' && (
          <AddressTab model={model} onSave={saveModel} saving={saving} />
        )}
        {activeTab === 'media' && (
          <MediaTab model={model} />
        )}
      </div>
    </div>
  );
}
