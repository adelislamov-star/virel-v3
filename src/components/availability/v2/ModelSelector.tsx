// MODEL SELECTOR - Checkbox list with search
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Model = {
  id: string;
  name: string;
  publicCode: string;
  conflictCount?: number;
  availableCount?: number;
};

export default function ModelSelector({ 
  models,
  selectedIds,
  onChange 
}: { 
  models: Model[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  
  const filtered = models.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.publicCode.toLowerCase().includes(search.toLowerCase())
  );
  
  function toggleModel(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }
  
  function selectAll() {
    onChange(filtered.map(m => m.id));
  }
  
  function clearAll() {
    onChange([]);
  }
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Models</CardTitle>
          <Badge variant="outline">
            {selectedIds.length}/{models.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-md bg-background"
        />
        
        {/* Bulk Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={selectAll}
            className="flex-1 text-xs"
          >
            Select All
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={clearAll}
            className="flex-1 text-xs"
          >
            Clear
          </Button>
        </div>
        
        {/* Model List */}
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {filtered.map(model => (
            <label
              key={model.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(model.id)}
                onChange={() => toggleModel(model.id)}
                className="w-4 h-4"
              />
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{model.name}</p>
                <p className="text-xs text-muted-foreground">{model.publicCode}</p>
              </div>
              
              {model.conflictCount ? (
                <Badge variant="destructive" className="text-xs">
                  {model.conflictCount}
                </Badge>
              ) : null}
            </label>
          ))}
          
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No models found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
