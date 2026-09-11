import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orgId = req.headers.get("x-organization-id") || "org-acme-1";
    const conversations = Database.getConversations(orgId);
    const conv = conversations.find((c) => c.id === id);

    if (!conv) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: conv });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = Database.deleteConversation(id);
    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully"
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
