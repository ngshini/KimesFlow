import { Card, CardContent } from "@/components/ui/card";

export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-36 rounded-md bg-slate-200" />
        <div className="mt-2 h-4 w-80 rounded-md bg-slate-100" />
      </div>
      <Card>
        <CardContent>
          <p className="text-sm text-slate-500">Đang tải project...</p>
        </CardContent>
      </Card>
    </div>
  );
}
