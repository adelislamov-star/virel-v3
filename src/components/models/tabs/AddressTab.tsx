// ADDRESS TAB
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AddressTab({ model }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Address & Outcalls</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Coming soon: Address fields + Airport outcalls checkboxes</p>
      </CardContent>
    </Card>
  );
}
