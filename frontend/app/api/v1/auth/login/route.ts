import { NextResponse } from "next/server";
import { Database } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const org = Database.getOrganizations()[0];
    const users = Database.getUsers(org.id);
    const user = users.find((u) => u.email === email) || users[0];

    return NextResponse.json({
      success: true,
      token: `auth_tok_${Date.now()}_${user.id}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        organization_id: org.id,
        organization_name: org.name
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
