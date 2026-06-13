"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="h-20 w-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-muted text-sm max-w-md mb-8">
        You do not have the required permissions to view this module. If you believe this is an error, please contact your system administrator.
      </p>
      <Button onClick={() => router.push("/dashboard")}>
        Return to Dashboard
      </Button>
    </div>
  );
}
