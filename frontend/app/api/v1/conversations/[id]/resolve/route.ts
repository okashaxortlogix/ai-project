import { NextResponse } from "next/server";
import { Database } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const updated = Database.updateConversationStatus(conversationId, "resolved");

  const org = Database.getOrganizations()[0];
  Database.addMessage({
    organization_id: org.id,
    conversation_id: conversationId,
    sender: "system",
    content: "Conversation has been marked as resolved."
  });

  return NextResponse.json({
    success: true,
    data: updated
  });
}
