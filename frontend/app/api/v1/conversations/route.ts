import { NextResponse } from "next/server";
import { Database } from "@/lib/db";

export async function GET(request: Request) {
  const org = Database.getOrganizations()[0];
  const conversations = Database.getConversations(org.id);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const query = searchParams.get("q");

  let filtered = conversations;
  if (status && status !== "all") {
    filtered = filtered.filter((c) => c.status === status);
  }
  if (query) {
    filtered = filtered.filter(
      (c) =>
        c.customer.name.toLowerCase().includes(query.toLowerCase()) ||
        c.last_message.toLowerCase().includes(query.toLowerCase())
    );
  }

  return NextResponse.json({
    success: true,
    data: filtered,
    meta: {
      total: filtered.length,
      organization_id: org.id
    }
  });
}
