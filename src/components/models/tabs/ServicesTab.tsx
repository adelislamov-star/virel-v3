// SERVICES TAB
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServicesTab({ model }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Services (70+ checkboxes)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Coming soon: All 58 services with checkboxes and extra price fields</p>
      </CardContent>
    </Card>
  );
}
