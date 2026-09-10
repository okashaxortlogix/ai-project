import { NextResponse } from "next/server";
import { Database } from "@/lib/db";

export async function GET() {
  const org = Database.getOrganizations()[0];
  const users = Database.getUsers(org.id);
  const user = users[0];

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      organization: {
        id: org.id,
        name: org.name,
        timezone: org.timezone
      }
    }
  });
}
