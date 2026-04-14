"use client";

import { use } from "react";
import { useApplications } from "@/lib/hooks/use-applications";
import { useAddons } from "@/lib/hooks/use-addons";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AppWindow, Database } from "lucide-react";
import Link from "next/link";

export default function OrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const { data: apps, isLoading: appsLoading } = useApplications(orgId);
  const { data: addons, isLoading: addonsLoading } = useAddons(orgId);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Resources</h2>

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">
            Applications ({apps?.length ?? "..."})
          </TabsTrigger>
          <TabsTrigger value="addons">
            Add-ons ({addons?.length ?? "..."})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-4">
          {appsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : apps?.length === 0 ? (
            <p className="text-muted-foreground">
              No applications in this organisation.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {apps?.map((app) => (
                <Link
                  key={app.id}
                  href={`/dashboard/${orgId}/${app.id}`}
                >
                  <Card className="transition-colors hover:bg-accent cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <AppWindow className="h-5 w-5 text-blue-500" />
                          <CardTitle className="text-sm">
                            {app.name}
                          </CardTitle>
                        </div>
                        {app.state && (
                          <Badge
                            variant={
                              app.state === "SHOULD_BE_UP"
                                ? "default"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {app.state === "SHOULD_BE_UP"
                              ? "Running"
                              : app.state}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        {app.instance?.variant?.name || app.app_type || ""}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="addons" className="mt-4">
          {addonsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : addons?.length === 0 ? (
            <p className="text-muted-foreground">
              No add-ons in this organisation.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {addons?.map((addon) => (
                <Link
                  key={addon.id}
                  href={`/dashboard/${orgId}/${addon.id}`}
                >
                  <Card className="transition-colors hover:bg-accent cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-emerald-500" />
                        <CardTitle className="text-sm">
                          {addon.name}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-xs">
                        {addon.provider?.name || ""}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
