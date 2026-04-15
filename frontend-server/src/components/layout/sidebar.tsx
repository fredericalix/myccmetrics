"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrganisations } from "@/lib/hooks/use-organisations";
import { useApplications } from "@/lib/hooks/use-applications";
import { useAddons } from "@/lib/hooks/use-addons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  AppWindow,
  Database,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { data: orgs, isLoading } = useOrganisations();

  if (isLoading) {
    return (
      <div className="space-y-3 px-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  const pathname = usePathname();

  return (
    <nav className="space-y-6 px-4 pb-8">
      {orgs?.map((org) => (
        <OrgSection key={org.id} orgId={org.id} orgName={org.name} />
      ))}
      {orgs?.length === 0 && (
        <p className="text-muted-foreground px-3 py-6 text-center text-sm">
          No organisations found
        </p>
      )}

      <div className="border-t border-border pt-4">
        <Link
          href="/dashboard/docs"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent",
            pathname === "/dashboard/docs"
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground",
          )}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span>Documentation</span>
        </Link>
      </div>
    </nav>
  );
}

function OrgSection({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();
  const { data: apps } = useApplications(orgId);
  const { data: addons } = useAddons(orgId);
  const isActive = pathname.includes(orgId);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-3 flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate flex-1 text-left">{orgName}</span>
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="space-y-0.5">
          {apps?.map((app) => (
            <Link
              key={app.id}
              href={`/dashboard/${orgId}/${app.id}`}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent",
                pathname === `/dashboard/${orgId}/${app.id}`
                  ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                  : "text-foreground/70",
              )}
            >
              <AppWindow className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="truncate">{app.name}</span>
            </Link>
          ))}
          {addons?.map((addon) => {
            const addonMetricId = addon.realId || addon.id;
            return (
              <Link
                key={addon.id}
                href={`/dashboard/${orgId}/${addonMetricId}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent",
                  pathname === `/dashboard/${orgId}/${addonMetricId}`
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    : "text-foreground/70",
                )}
              >
                <Database className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="truncate">{addon.name}</span>
              </Link>
            );
          })}
          {!apps?.length && !addons?.length && (
            <p className="text-muted-foreground px-3 py-1 text-xs">
              No resources
            </p>
          )}
        </div>
      )}
    </div>
  );
}
