import { NextResponse } from "next/server";
import { Database } from "@/lib/db";
import { AiOrchestrator } from "@/lib/ai-orchestrator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { content, sender = "customer" } = body;

    const org = Database.getOrganizations()[0];
    const conversations = Database.getConversations(org.id);
    const conv = conversations.find((c) => c.id === conversationId);

    if (!conv) {
      return NextResponse.json(
        { success: false, message: "Conversation not found" },
        { status: 404 }
      );
    }

    // 1. Record customer message in DB
    const customerMsg = Database.addMessage({
      organization_id: org.id,
      conversation_id: conversationId,
      sender: sender,
      content: content
    });

    // 2. Dispatch through AI Orchestrator
    const aiResult = await AiOrchestrator.processMessage(
      org.id,
      conversationId,
      conv.customer_id,
      conv.customer.name,
      content
    );

    // 3. Record agent response in DB
    const agentMsg = Database.addMessage({
      organization_id: org.id,
      conversation_id: conversationId,
      sender: "agent",
      agent_type: aiResult.agentType,
      content: aiResult.reply,
      metadata: {
        toolExecuted: aiResult.toolExecuted,
        groundedSource: aiResult.groundedSource
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        customerMessage: customerMsg,
        agentMessage: agentMsg,
        intent: aiResult.agentType,
        toolExecuted: aiResult.toolExecuted,
        groundedSource: aiResult.groundedSource,
        orchestrator: {
          reply: aiResult.reply,
          agentType: aiResult.agentType,
          toolExecuted: aiResult.toolExecuted,
          groundedSource: aiResult.groundedSource,
          modelUsed: aiResult.modelUsed,
          isRealLLM: aiResult.isRealLLM
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
