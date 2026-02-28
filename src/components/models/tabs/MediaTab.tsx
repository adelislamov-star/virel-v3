// MEDIA GALLERY TAB
// Features: upload photos/videos, drag-and-drop reorder, set primary, delete
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  isPrimary: boolean;
  isPublic: boolean;
  sortOrder: number;
}

interface Props {
  model: any;
}

export default function MediaTab({ model }: Props) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modelId = model.id;

  useEffect(() => {
    loadMedia();
  }, [modelId]);

  async function loadMedia() {
    try {
      const res = await fetch(`/api/v1/models/${modelId}/media`);
      const data = await res.json();
      if (data.success) {
        setMedia(data.data.media.sort((a: MediaItem, b: MediaItem) => a.sortOrder - b.sortOrder));
      }
    } catch (e) {
      console.error('Failed to load media', e);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------
  // UPLOAD
  // -------------------------------------------

  async function uploadFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    setUploading(true);
    setUploadProgress([]);
    const errors: string[] = [];

    for (const file of fileArray) {
      setUploadProgress(prev => [...prev, `Uploading ${file.name}...`]);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('isPrimary', media.length === 0 ? 'true' : 'false');

      try {
        const res = await fetch(`/api/v1/models/${modelId}/media`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          setMedia(prev => [...prev, data.data.media].sort((a, b) => a.sortOrder - b.sortOrder));
          setUploadProgress(prev =>
            prev.map(p => p.includes(file.name) ? `✅ ${file.name}` : p)
          );
        } else {
          errors.push(`${file.name}: ${data.error?.message}`);
          setUploadProgress(prev =>
            prev.map(p => p.includes(file.name) ? `❌ ${file.name}: ${data.error?.message}` : p)
          );
        }
      } catch (e: any) {
        errors.push(`${file.name}: Network error`);
      }
    }

    setUploading(false);
    setTimeout(() => setUploadProgress([]), 3000);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) uploadFiles(e.target.files);
    e.target.value = '';
  }

  function handleDropZoneDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  // -------------------------------------------
  // DRAG-AND-DROP REORDER
  // -------------------------------------------

  function handleItemDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleItemDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id !== draggingId) setDragOverId(id);
  }

  function handleItemDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    setMedia(prev => {
      const list = [...prev];
      const fromIdx = list.findIndex(m => m.id === draggingId);
      const toIdx = list.findIndex(m => m.id === targetId);
      const [removed] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, removed);
      return list.map((item, idx) => ({ ...item, sortOrder: idx }));
    });

    setDraggingId(null);
    setDragOverId(null);
  }

  async function saveOrder() {
    setSaving(true);
    try {
      await fetch(`/api/v1/models/${modelId}/media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: media.map((m, idx) => ({ id: m.id, sortOrder: idx })),
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  // -------------------------------------------
  // ACTIONS
  // -------------------------------------------

  async function setPrimary(mediaId: string) {
    setMedia(prev => prev.map(m => ({ ...m, isPrimary: m.id === mediaId })));
    await fetch(`/api/v1/models/${modelId}/media/${mediaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPrimary: true }),
    });
  }

  async function togglePublic(mediaId: string, current: boolean) {
    setMedia(prev => prev.map(m => m.id === mediaId ? { ...m, isPublic: !current } : m));
    await fetch(`/api/v1/models/${modelId}/media/${mediaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !current }),
    });
  }

  async function deleteItem(mediaId: string) {
    if (!confirm('Delete this file?')) return;
    setMedia(prev => prev.filter(m => m.id !== mediaId));
    await fetch(`/api/v1/models/${modelId}/media/${mediaId}`, { method: 'DELETE' });
  }

  // -------------------------------------------
  // RENDER
  // -------------------------------------------

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">Loading media...</CardContent>
      </Card>
    );
  }

  const photos = media.filter(m => m.type === 'photo');
  const videos = media.filter(m => m.type === 'video');

  return (
    <div className="space-y-4">

      {/* Upload zone */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDropZoneDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-4xl mb-2">📸</div>
            <p className="font-medium">Drop photos or videos here</p>
            <p className="text-sm text-muted-foreground mt-1">
              JPG, PNG, WebP up to 20MB · MP4, MOV up to 200MB · Multiple files at once
            </p>
            {uploading && (
              <p className="text-sm text-primary mt-2 animate-pulse">Uploading...</p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileInput}
          />

          {/* Upload progress */}
          {uploadProgress.length > 0 && (
            <div className="space-y-1">
              {uploadProgress.map((msg, i) => (
                <p key={i} className="text-xs text-muted-foreground">{msg}</p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                📁 Browse Files
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              {media.length} file{media.length !== 1 ? 's' : ''}
              {photos.length > 0 && ` · ${photos.length} photos`}
              {videos.length > 0 && ` · ${videos.length} videos`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Photos Gallery */}
      {photos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>📸 Photos ({photos.length})</span>
              <Button
                size="sm"
                variant="outline"
                onClick={saveOrder}
                disabled={saving}
              >
                {saving ? 'Saving...' : '💾 Save Order'}
              </Button>
            </CardTitle>
            <p className="text-xs text-muted-foreground">Drag to reorder · First photo is gallery order</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {photos.map(item => (
                <MediaCard
                  key={item.id}
                  item={item}
                  isDragging={draggingId === item.id}
                  isDragOver={dragOverId === item.id}
                  onDragStart={handleItemDragStart}
                  onDragOver={handleItemDragOver}
                  onDrop={handleItemDrop}
                  onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                  onSetPrimary={setPrimary}
                  onTogglePublic={togglePublic}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🎬 Videos ({videos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {videos.map(item => (
                <MediaCard
                  key={item.id}
                  item={item}
                  isDragging={draggingId === item.id}
                  isDragOver={dragOverId === item.id}
                  onDragStart={handleItemDragStart}
                  onDragOver={handleItemDragOver}
                  onDrop={handleItemDrop}
                  onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                  onSetPrimary={setPrimary}
                  onTogglePublic={togglePublic}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {media.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No media yet. Upload photos or videos above.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// -------------------------------------------
// MEDIA CARD COMPONENT
// -------------------------------------------

interface MediaCardProps {
  item: MediaItem;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onSetPrimary: (id: string) => void;
  onTogglePublic: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

function MediaCard({
  item, isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onSetPrimary, onTogglePublic, onDelete,
}: MediaCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, item.id)}
      onDragOver={e => onDragOver(e, item.id)}
      onDrop={e => onDrop(e, item.id)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative rounded-lg overflow-hidden border-2 transition-all select-none ${
        isDragging ? 'opacity-40 scale-95 cursor-grabbing' : 'cursor-grab'
      } ${
        isDragOver ? 'border-primary scale-105' : 'border-transparent'
      } ${
        item.isPrimary ? 'ring-2 ring-amber-400' : ''
      }`}
      style={{ aspectRatio: '3/4' }}
    >
      {/* Media */}
      {item.type === 'photo' ? (
        <img
          src={item.url}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
          <span className="text-4xl">🎬</span>
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
        {item.isPrimary && (
          <Badge className="text-xs py-0 px-1.5 bg-amber-400 text-amber-900 border-0">
            ★ Primary
          </Badge>
        )}
        {!item.isPublic && (
          <Badge variant="secondary" className="text-xs py-0 px-1.5">
            🔒 Private
          </Badge>
        )}
      </div>

      {/* Drag handle */}
      <div className="absolute top-1.5 right-1.5 text-white/70 text-lg cursor-grab">
        ⠿
      </div>

      {/* Hover overlay */}
      {hovered && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-end gap-1.5 p-2">
          {!item.isPrimary && item.type === 'photo' && (
            <button
              onClick={() => onSetPrimary(item.id)}
              className="w-full text-xs bg-amber-400 text-amber-900 rounded px-2 py-1 font-medium hover:bg-amber-300"
            >
              ★ Set Primary
            </button>
          )}
          <button
            onClick={() => onTogglePublic(item.id, item.isPublic)}
            className="w-full text-xs bg-white/20 text-white rounded px-2 py-1 hover:bg-white/30"
          >
            {item.isPublic ? '🔒 Make Private' : '🌐 Make Public'}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="w-full text-xs bg-red-500/80 text-white rounded px-2 py-1 hover:bg-red-500"
          >
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
}
