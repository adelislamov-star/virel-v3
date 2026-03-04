// REVIEWS & REPUTATION PAGE
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

type Review = {
  id: string;
  bookingId: string;
  booking?: { id: string; shortId?: string; startAt: string };
  client?: { id: string; fullName: string };
  model?: { id: string; name: string; slug: string };
  modelId: string;
  rating: number;
  text?: string;
  status: string;
  toxicityFlag: boolean;
  suspiciousFlag: boolean;
  replyByModel?: string;
  replyByManager?: string;
  createdAt: string;
};

const STATUS_FILTERS = ['all', 'pending', 'approved', 'flagged', 'escalated', 'rejected'] as const;

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: 'yellow',
    approved: 'default',
    rejected: 'destructive',
    flagged: 'orange',
    escalated: 'secondary'
  };
  return (colors[status] || 'default') as any;
}

function renderStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const limit = 20;

  useEffect(() => {
    loadReviews();
  }, [filter, page]);

  async function loadReviews() {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/v1/reviews?${params}`);
      const data = await res.json();
      setReviews(data.data?.reviews || []);
      setTotal(data.data?.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(reviewId: string, newStatus: string) {
    try {
      setSubmitting(true);
      await fetch(`/api/v1/reviews/${reviewId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus })
      });
      await loadReviews();
    } catch (error) {
      console.error('Failed to change status:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReply(reviewId: string) {
    if (!replyText.trim()) return;
    try {
      setSubmitting(true);
      await fetch(`/api/v1/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyType: 'manager', text: replyText })
      });
      setReplyText('');
      await loadReviews();
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setSubmitting(false);
    }
  }

  function getActionButtons(review: Review) {
    const buttons: { label: string; status: string; variant: any }[] = [];
    switch (review.status) {
      case 'pending':
        buttons.push(
          { label: 'Approve', status: 'approved', variant: 'default' },
          { label: 'Reject', status: 'rejected', variant: 'destructive' },
          { label: 'Flag', status: 'flagged', variant: 'outline' }
        );
        break;
      case 'flagged':
        buttons.push(
          { label: 'Approve', status: 'approved', variant: 'default' },
          { label: 'Reject', status: 'rejected', variant: 'destructive' },
          { label: 'Escalate', status: 'escalated', variant: 'secondary' }
        );
        break;
      case 'escalated':
        buttons.push(
          { label: 'Approve', status: 'approved', variant: 'default' },
          { label: 'Reject', status: 'rejected', variant: 'destructive' }
        );
        break;
      case 'approved':
        buttons.push(
          { label: 'Escalate', status: 'escalated', variant: 'secondary' }
        );
        break;
    }
    return buttons;
  }

  const totalPages = Math.ceil(total / limit);

  if (loading && reviews.length === 0) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">⭐ Reviews & Reputation</h1>
        <p className="text-muted-foreground">{total} reviews total</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map(s => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? 'default' : 'outline'}
            onClick={() => { setFilter(s); setPage(1); }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map(review => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getStatusColor(review.status)}>
                      {review.status}
                    </Badge>
                    {review.toxicityFlag && <Badge variant="destructive">Toxic</Badge>}
                    {review.suspiciousFlag && <Badge variant="orange">Suspicious</Badge>}
                    <Badge variant="outline">
                      <span className="text-yellow-500 mr-1">{renderStars(review.rating)}</span>
                      {review.rating}/5
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mb-1">
                    <Link
                      href={`/admin/models/${review.modelId}`}
                      className="font-semibold hover:underline"
                      onClick={e => e.stopPropagation()}
                    >
                      {review.model?.name || 'Unknown Model'}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      by {review.client?.fullName || 'Unknown Client'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {review.text ? (review.text.length > 100 ? review.text.slice(0, 100) + '...' : review.text) : 'No text'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  {getActionButtons(review).map(btn => (
                    <Button
                      key={btn.status}
                      size="sm"
                      variant={btn.variant}
                      disabled={submitting}
                      onClick={() => changeStatus(review.id, btn.status)}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === review.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  {review.text && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Full Review:</p>
                      <p className="text-sm">{review.text}</p>
                    </div>
                  )}
                  {review.replyByModel && (
                    <div className="pl-4 border-l-2 border-blue-500">
                      <p className="text-xs font-semibold text-blue-500">Model Reply:</p>
                      <p className="text-sm">{review.replyByModel}</p>
                    </div>
                  )}
                  {review.replyByManager && (
                    <div className="pl-4 border-l-2 border-green-500">
                      <p className="text-xs font-semibold text-green-500">Manager Reply:</p>
                      <p className="text-sm">{review.replyByManager}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      className="flex-1 rounded-md border p-2 text-sm bg-background"
                      placeholder="Reply as Manager..."
                      value={expandedId === review.id ? replyText : ''}
                      onChange={e => setReplyText(e.target.value)}
                      rows={2}
                    />
                    <Button
                      size="sm"
                      disabled={submitting || !replyText.trim()}
                      onClick={() => submitReply(review.id)}
                    >
                      Reply as Manager
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {reviews.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No reviews found.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
