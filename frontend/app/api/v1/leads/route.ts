import { NextResponse } from "next/server";
import { Database } from "@/lib/db";

export async function GET(request: Request) {
  const org = Database.getOrganizations()[0];
  const leads = Database.getLeads(org.id);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const query = searchParams.get("q");

  let filtered = leads;
  if (status && status !== "All") {
    filtered = filtered.filter((l) => l.status === status);
  }
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.company && l.company.toLowerCase().includes(q))
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const org = Database.getOrganizations()[0];

    const newLead = Database.createLead({
      organization_id: org.id,
      customer_id: body.customer_id || `cust-${Date.now()}`,
      name: body.name,
      email: body.email,
      phone: body.phone || "+1 234 567 8900",
      source: body.source || "Website",
      status: body.status || "New",
      score: body.score || 50,
      avatar: body.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      company: body.company,
      notes: body.notes
    });

    return NextResponse.json({
      success: true,
      data: newLead
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
