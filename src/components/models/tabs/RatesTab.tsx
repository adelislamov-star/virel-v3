// RATES TAB
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RatesTab({ model }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Rates</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Coming soon: Rates table (30min, 1h, 2h, etc - incall/outcall)</p>
      </CardContent>
    </Card>
  );
}
