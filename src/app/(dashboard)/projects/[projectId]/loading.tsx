import { Card, CardContent } from "@/components/ui/card";

export default function ProjectDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 rounded-md bg-slate-200" />
      <Card>
        <CardContent>
          <p className="text-sm text-slate-500">Đang tải chi tiết project...</p>
        </CardContent>
      </Card>
    </div>
  );
}
