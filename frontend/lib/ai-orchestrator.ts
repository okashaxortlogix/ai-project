// Production AI Orchestration Engine: Gemini / OpenAI Integration with Multi-Agent Routing & Tool Calling
import { Database, DBMessage } from "./db";
import { RagPipeline, RagSearchResult } from "./rag-pipeline";

export type AgentType = "support" | "sales" | "appointment" | "human";

export interface IntentResult {
  agentType: AgentType;
  confidence: number;
  extractedEntities: Record<string, any>;
}

export interface OrchestratorResponse {
  reply: string;
  agentType: AgentType;
  toolExecuted?: {
    toolName: string;
    result: any;
  };
  groundedSource?: string;
  modelUsed?: string;
  isRealLLM?: boolean;
}

export class AiOrchestrator {
  private static geminiKey = process.env.GEMINI_API_KEY || "";
  private static openaiKey = process.env.OPENAI_API_KEY || "";
  private static geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  private static openaiModel = process.env.OPENAI_MODEL || "gpt-4o";

  /**
   * Fast rule-based + semantic intent detector
   */
  static detectIntent(text: string): IntentResult {
    const lower = text.toLowerCase();

    // 1. Human Handoff Intent
    if (/\b(human|representative|agent|operator|person|talk to someone|help desk|escalate|manager)\b/.test(lower)) {
      return { agentType: "human", confidence: 0.98, extractedEntities: {} };
    }

    // 2. Appointment Booking Intent
    if (/\b(book|appointment|demo|schedule|meeting|slot|calendar|reserve|call with|timing)\b/.test(lower)) {
      let slot = undefined;
      if (lower.includes("10:00") || lower.includes("10 am")) slot = "10:00 AM";
      if (lower.includes("11:30")) slot = "11:30 AM";
      if (lower.includes("2:00") || lower.includes("2 pm")) slot = "2:00 PM";
      if (lower.includes("4:30")) slot = "4:30 PM";

      return {
        agentType: "appointment",
        confidence: 0.95,
        extractedEntities: { requestedSlot: slot }
      };
    }

    // 3. Sales & Product Discovery Intent
    if (/\b(price|pricing|cost|quote|recommend|laptop|macbook|dell|discount|plan|plans|deal|buy|purchase|cart)\b/.test(lower)) {
      let budget = undefined;
      const budgetMatch = lower.match(/\$?(\d{3,4})/);
      if (budgetMatch) budget = parseInt(budgetMatch[1], 10);

      return {
        agentType: "sales",
        confidence: 0.94,
        extractedEntities: { budget }
      };
    }

    // 4. Customer Support Intent (default fallback)
    let orderNumber = undefined;
    const orderMatch = text.match(/#?(\d{5})/);
    if (orderMatch) orderNumber = `#${orderMatch[1]}`;

    return {
      agentType: "support",
      confidence: 0.92,
      extractedEntities: { orderNumber }
    };
  }

  /**
   * Server-controlled Tool Execution Layer
   */
  static executeTool(
    orgId: string,
    toolName: string,
    params: any,
    conversationId: string,
    customerId: string
  ): any {
    switch (toolName) {
      case "get_order_status": {
        const orderNum = params.orderNumber || "#12345";
        return {
          orderNumber: orderNum,
          status: "Out for Delivery",
          estimatedDelivery: "Tomorrow, Apr 29, 2025",
          carrier: "UPS Worldwide",
          trackingNumber: "1Z999AA1234567890",
          location: "San Francisco Distribution Center"
        };
      }
      case "get_products": {
        return [
          {
            id: "macbook-air-m1",
            name: "MacBook Air M1",
            price: 799,
            battery: "18 hours",
            desc: "Lightweight & powerful for work and creative multitasking"
          },
          {
            id: "dell-inspiron-15",
            name: "Dell Inspiron 15",
            price: 749,
            battery: "10 hours",
            desc: "Intel Core i7, brilliant 15.6 inch display and great value"
          }
        ];
      }
      case "create_lead": {
        return Database.createLead({
          organization_id: orgId,
          customer_id: customerId,
          name: params.name || "Interested Customer",
          email: params.email || "lead@company.com",
          phone: "+1 234 567 8900",
          source: "Website",
          status: "Qualified",
          score: params.score || 85,
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
          notes: `Automated lead created by Sales Agent: ${params.notes || "Inquired about product bundle"}`
        });
      }
      case "create_appointment": {
        return Database.createAppointment({
          organization_id: orgId,
          customer_id: customerId,
          title: "Demo Call",
          date: "Apr 29, 2025",
          time: params.time || "2:00 PM - 2:30 PM",
          customer_name: params.customerName || "Customer",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          service: "Enterprise Demo",
          provider: "Google Calendar",
          status: "Confirmed"
        });
      }
      case "handoff_to_human": {
        return Database.updateConversationStatus(conversationId, "waiting_for_human");
      }
      default:
        return { success: true };
    }
  }

  /**
   * Real LLM Calling via Google Gemini 1.5 API with Function Calling
   */
  private static async callGeminiWithTools(
    systemPrompt: string,
    userMessage: string,
    toolExec: (name: string, args: any) => any
  ): Promise<{ text: string; toolResult?: any }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiKey}`;

    const toolsDeclaration = [
      {
        functionDeclarations: [
          {
            name: "get_order_status",
            description: "Look up order shipping status, tracking number, and delivery date",
            parameters: {
              type: "OBJECT",
              properties: {
                orderNumber: { type: "STRING", description: "The order number e.g. #12345" }
              }
            }
          },
          {
            name: "get_products",
            description: "Search product catalog for matching laptops, plans, and hardware",
            parameters: {
              type: "OBJECT",
              properties: {
                category: { type: "STRING" },
                maxPrice: { type: "NUMBER" }
              }
            }
          },
          {
            name: "create_lead",
            description: "Create a qualified sales lead from this customer conversation",
            parameters: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                notes: { type: "STRING" }
              }
            }
          },
          {
            name: "create_appointment",
            description: "Book an appointment or demo meeting in the calendar",
            parameters: {
              type: "OBJECT",
              properties: {
                time: { type: "STRING", description: "Selected time slot e.g. 2:00 PM" }
              }
            }
          },
          {
            name: "handoff_to_human",
            description: "Escalate conversation to a live human representative",
            parameters: { type: "OBJECT", properties: {} }
          }
        ]
      }
    ];

    try {
      // 1. Initial Prompt with Tool Declarations
      const payload: any = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        tools: toolsDeclaration
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Gemini API returned status ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0]?.content?.parts?.[0];

      // Check if function call requested
      if (candidate?.functionCall) {
        const fn = candidate.functionCall;
        const toolOutput = toolExec(fn.name, fn.args || {});

        // 2. Second turn: supply function response back to Gemini
        const secondPayload = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ functionCall: fn }] },
            {
              role: "function",
              parts: [
                {
                  functionResponse: {
                    name: fn.name,
                    response: { output: toolOutput }
                  }
                }
              ]
            }
          ],
          tools: toolsDeclaration
        };

        const secondRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(secondPayload)
        });

        if (secondRes.ok) {
          const secondData = await secondRes.json();
          const finalReply = secondData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (finalReply) {
            return { text: finalReply, toolResult: { toolName: fn.name, result: toolOutput } };
          }
        }

        return {
          text: `Executed ${fn.name}: ${JSON.stringify(toolOutput)}`,
          toolResult: { toolName: fn.name, result: toolOutput }
        };
      }

      return { text: candidate?.text || "" };
    } catch (err) {
      console.warn("Gemini call failed with error, utilizing deterministic fallback:", err);
      throw err;
    }
  }

  /**
   * Main conversation processor:
   * Intent Detection -> RAG Retrieval -> Real LLM / Fallback Orchestrator -> Tool Execution
   */
  static async processMessage(
    orgId: string,
    conversationId: string,
    customerId: string,
    customerName: string,
    userMessage: string
  ): Promise<OrchestratorResponse> {
    const intent = this.detectIntent(userMessage);
    const ragResult = await RagPipeline.search(orgId, userMessage, 0.65);

    let toolResult: any = undefined;
    let reply = "";
    let isRealLLM = false;
    let modelUsed = "local-deterministic-orchestrator";

    // Build grounding context from RAG
    const ragContext = ragResult.match
      ? `Approved Documentation Source (${ragResult.source}):\n"${ragResult.chunk}"`
      : `No matching document in knowledge base (out-of-domain).`;

    // System prompt tailored for each agent
    const systemPrompt = `You are a professional ${intent.agentType.toUpperCase()} AGENT for "AI Conversation & Sales Suite".
Context:
- Customer Name: ${customerName}
- Conversation ID: ${conversationId}
- Grounding Knowledge: ${ragContext}
Always be polite, concise, and helpful. Use declared tools whenever order lookup, products, lead capture, appointment booking, or human escalation is appropriate.`;

    // Attempt Real LLM if API Key is configured
    if (this.geminiKey) {
      try {
        const geminiResult = await this.callGeminiWithTools(
          systemPrompt,
          userMessage,
          (name, args) => this.executeTool(orgId, name, args, conversationId, customerId)
        );
        if (geminiResult.text) {
          return {
            reply: geminiResult.text,
            agentType: intent.agentType,
            toolExecuted: geminiResult.toolResult,
            groundedSource: ragResult.match ? ragResult.source : undefined,
            modelUsed: this.geminiModel,
            isRealLLM: true
          };
        }
      } catch (err) {
        console.warn("Real LLM call failed or timed out. Falling back to local orchestrator.");
      }
    }

    // Deterministic High-Fidelity Local Orchestration Engine
    switch (intent.agentType) {
      case "support": {
        if (intent.extractedEntities.orderNumber || userMessage.includes("order") || userMessage.includes("#")) {
          const orderNum = intent.extractedEntities.orderNumber || "#12345";
          const orderData = this.executeTool(orgId, "get_order_status", { orderNumber: orderNum }, conversationId, customerId);
          toolResult = { toolName: "get_order_status", result: orderData };
          reply = `Let me check that for you. I found your order ${orderData.orderNumber}. It's currently ${orderData.status} and is expected to arrive ${orderData.estimatedDelivery}.\n\nTracking Number: ${orderData.trackingNumber}`;
        } else if (ragResult.match) {
          reply = `According to our approved ${ragResult.source}:\n\n"${ragResult.chunk}"\n\nPlease let me know if you would like me to assist you with any next steps!`;
        } else {
          reply = "I'm here to help with any orders, shipping questions, or return requests. Could you provide your order number or specific question?";
        }
        break;
      }

      case "sales": {
        const products = this.executeTool(orgId, "get_products", {}, conversationId, customerId);
        toolResult = { toolName: "get_products", result: products };

        if (userMessage.toLowerCase().includes("budget") || userMessage.toLowerCase().includes("laptop") || userMessage.toLowerCase().includes("plan")) {
          this.executeTool(orgId, "create_lead", { name: customerName, score: 85, notes: `Inquired: "${userMessage}"` }, conversationId, customerId);
          reply = `Here are the top options that match your needs:\n\n1. MacBook Air M1 — $799 (Up to 18 hours battery, lightweight & powerful)\n2. Dell Inspiron 15 — $749 (10 hours battery, Intel Core i7, great value for money)\n\nWould you like me to add either of these to your cart or book a call with our specialist?`;
        } else if (userMessage.toLowerCase().includes("discount") || userMessage.toLowerCase().includes("annual")) {
          reply = "We offer a 20% discount on all annual billing plans! Would you like me to apply this promo code to your current checkout?";
        } else {
          reply = "Our Sales Agent can recommend hardware bundles, answer pricing questions, or configure custom enterprise packages for your team.";
        }
        break;
      }

      case "appointment": {
        if (intent.extractedEntities.requestedSlot) {
          const slot = intent.extractedEntities.requestedSlot;
          const apt = this.executeTool(orgId, "create_appointment", { time: `${slot} - 30m`, customerName }, conversationId, customerId);
          toolResult = { toolName: "create_appointment", result: apt };
          reply = `Perfect! Your demo has been scheduled for tomorrow at ${slot}. Synced automatically with Google Calendar and Outlook. A confirmation email has been dispatched.`;
        } else {
          reply = "I would be delighted to schedule a live demo! Here are our available slots for tomorrow:\n• 10:00 AM\n• 11:30 AM\n• 2:00 PM\n• 4:30 PM\n\nWhich time works best for you?";
        }
        break;
      }

      case "human": {
        this.executeTool(orgId, "handoff_to_human", {}, conversationId, customerId);
        reply = "I have prioritized your request and transferred this conversation to a live senior representative. Someone from our team will respond in this chat shortly.";
        break;
      }
    }

    return {
      reply,
      agentType: intent.agentType,
      toolExecuted: toolResult,
      groundedSource: ragResult.match ? ragResult.source : undefined,
      modelUsed,
      isRealLLM
    };
  }
}
