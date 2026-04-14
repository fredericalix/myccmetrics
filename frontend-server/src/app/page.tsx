import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, Cpu, HardDrive, Network, MemoryStick } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BarChart3 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">MyCCmetrics</h1>
          <p className="text-muted-foreground">
            Real-time monitoring dashboard for your Clever Cloud applications
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in with your Clever Cloud account to view your application
              metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a href="/auth/login" className="block">
              <Button className="w-full" size="lg">
                Sign in with Clever Cloud
              </Button>
            </a>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="flex flex-col items-center gap-1 rounded-lg border p-3">
            <Cpu className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">CPU</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg border p-3">
            <MemoryStick className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Memory</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg border p-3">
            <Network className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Network</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg border p-3">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Disk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
