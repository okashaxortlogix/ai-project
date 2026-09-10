import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || "2025-04-29";

  const slots = [
    { time: "10:00 AM", available: true },
    { time: "11:30 AM", available: true },
    { time: "2:00 PM", available: true },
    { time: "4:30 PM", available: true }
  ];

  return NextResponse.json({
    success: true,
    date,
    available_slots: ["10:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"],
    booked_slots: ["1:00 PM", "3:00 PM"],
    data: {
      date,
      timezone: "America/New_York",
      slots
    }
  });
}
