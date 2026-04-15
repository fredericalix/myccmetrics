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
    <div className="flex min-h-screen flex-col items-center justify-center cc-gradient p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BarChart3 className="h-14 w-14 text-white drop-shadow-lg" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            MyCCmetrics
          </h1>
          <p className="text-white/80">
            Real-time monitoring dashboard for your Clever Cloud applications
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in with your Clever Cloud account to view your application
              metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a href="/auth/login" className="block">
              <Button className="w-full bg-[#a51050] hover:bg-[#8a0d43] text-white" size="lg">
                Sign in with Clever Cloud
              </Button>
            </a>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-white/10 backdrop-blur-sm p-3 border border-white/20">
            <Cpu className="h-5 w-5 text-white/80" />
            <span className="text-xs text-white/70">CPU</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-white/10 backdrop-blur-sm p-3 border border-white/20">
            <MemoryStick className="h-5 w-5 text-white/80" />
            <span className="text-xs text-white/70">Memory</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-white/10 backdrop-blur-sm p-3 border border-white/20">
            <Network className="h-5 w-5 text-white/80" />
            <span className="text-xs text-white/70">Network</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-white/10 backdrop-blur-sm p-3 border border-white/20">
            <HardDrive className="h-5 w-5 text-white/80" />
            <span className="text-xs text-white/70">Disk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
