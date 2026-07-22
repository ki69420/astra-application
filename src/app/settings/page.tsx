import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3">
        <h1 className="text-lg font-bold leading-tight">Settings</h1>
        <p className="text-xs text-muted-foreground">Platform configuration</p>
      </header>

      <div className="px-4 py-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription className="text-xs">Project Astra — Tuition Management System</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Version", "1.0.0"],
              ["Database", "PostgreSQL via Supabase"],
              ["Storage", "Supabase Storage (private buckets)"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1 border-b last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
