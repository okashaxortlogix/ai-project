import { NextResponse } from "next/server";
import { Database } from "@/lib/db";

export async function GET() {
  const org = Database.getOrganizations()[0];
  const integrations = Database.getIntegrations(org.id);

  return NextResponse.json({
    success: true,
    data: integrations
  });
}
