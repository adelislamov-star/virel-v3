// REVENUE LEAKAGE CONTROL — PLACEHOLDER
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RevenuLeakagePage() {
  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">📉 Revenue Leakage Control</h1>
        <p className="text-muted-foreground">Track and prevent revenue loss</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 3</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Revenue leakage tracking, root cause analysis, and automated alerts will be available in Phase 3.
          </p>
          <Link href="/admin/reports">
            <Button variant="outline">View Reports</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
