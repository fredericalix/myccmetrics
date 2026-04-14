"use client";

import { useOrganisations } from "@/lib/hooks/use-organisations";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: orgs, isLoading } = useOrganisations();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Organisations</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Organisations</h2>
      {orgs?.length === 0 && (
        <p className="text-muted-foreground">
          No organisations found. Make sure your Clever Cloud account has access
          to at least one organisation.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orgs?.map((org) => (
          <Link key={org.id} href={`/dashboard/${org.id}`}>
            <Card className="transition-colors hover:bg-accent cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{org.name}</CardTitle>
                    <CardDescription className="text-xs font-mono">
                      {org.id}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
