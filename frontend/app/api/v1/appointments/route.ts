import { NextResponse } from "next/server";
import { Database } from "@/lib/db";

export async function GET() {
  const org = Database.getOrganizations()[0];
  const appointments = Database.getAppointments(org.id);

  return NextResponse.json({
    success: true,
    data: appointments,
    meta: {
      total: appointments.length,
      organization_id: org.id
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const org = Database.getOrganizations()[0];

    const newApt = Database.createAppointment({
      organization_id: org.id,
      customer_id: body.customer_id || `cust-${Date.now()}`,
      title: body.title || "Demo Call",
      date: body.date || "Apr 29, 2025",
      time: body.time || "2:00 PM - 2:30 PM",
      customer_name: body.customer_name || "Customer",
      avatar: body.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      service: body.service || "Customer Onboarding",
      provider: body.provider || "Google Calendar",
      status: body.status || "Confirmed"
    });

    return NextResponse.json({
      success: true,
      data: newApt
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
