import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-40 rounded-md bg-slate-200" />
        <div className="mt-2 h-4 w-80 rounded-md bg-slate-100" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardContent>
              <div className="h-4 w-28 rounded-md bg-slate-100" />
              <div className="mt-3 h-8 w-16 rounded-md bg-slate-200" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent>
          <p className="text-sm text-slate-500">Đang tải dashboard...</p>
        </CardContent>
      </Card>
    </div>
  );
}
