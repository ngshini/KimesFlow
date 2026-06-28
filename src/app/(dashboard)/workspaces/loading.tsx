import { Card, CardContent } from "@/components/ui/card";

export default function WorkspacesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-44 rounded-md bg-slate-200" />
        <div className="mt-2 h-4 w-72 rounded-md bg-slate-100" />
      </div>
      <Card>
        <CardContent>
          <p className="text-sm text-slate-500">Đang tải workspace...</p>
        </CardContent>
      </Card>
    </div>
  );
}
