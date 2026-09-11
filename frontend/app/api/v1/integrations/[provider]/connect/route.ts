import { NextResponse } from "next/server";
import { Database } from "@/lib/db";
import { GoogleCalendarClient } from "@/lib/integrations/google-calendar";
import { ShopifyClient } from "@/lib/integrations/shopify";
import { WooCommerceClient } from "@/lib/integrations/woocommerce";
import { HubSpotClient } from "@/lib/integrations/hubspot";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty body
    }

    const org = Database.getOrganizations()[0];
    let testResult = { connected: true, message: "Connected successfully" };

    if (provider === "google_calendar") {
      const client = new GoogleCalendarClient(body);
      testResult = await client.testConnection();
    } else if (provider === "shopify") {
      const client = new ShopifyClient(body);
      testResult = await client.testConnection();
    } else if (provider === "woocommerce") {
      const client = new WooCommerceClient(body);
      testResult = await client.testConnection();
    } else if (provider === "hubspot") {
      const client = new HubSpotClient(body);
      testResult = await client.testConnection();
    }

    if (body.testOnly) {
      return NextResponse.json({
        success: testResult.connected,
        provider,
        diagnostic: testResult
      });
    }

    const updated = Database.toggleIntegration(org.id, provider);

    return NextResponse.json({
      success: true,
      data: updated,
      diagnostic: testResult
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
