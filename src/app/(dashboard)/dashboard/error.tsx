"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-950">Không thể tải dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">{error.message}</p>
        </div>
        <Button type="button" onClick={reset}>
          Thử lại
        </Button>
      </CardContent>
    </Card>
  );
}
