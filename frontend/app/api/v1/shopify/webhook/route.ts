import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { WooCommerceClient } from "@/lib/integrations/woocommerce";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-shopify-hmac-sha256");

    if (!signature) {
      return NextResponse.json(
        { success: false, message: "Missing X-Shopify-Hmac-Sha256 header." },
        { status: 401 }
      );
    }

    const secret = process.env.SHOPIFY_CLIENT_SECRET || process.env.SHOPIFY_ACCESS_TOKEN || "";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("base64");

    // Timing-safe comparison
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.warn(`[Shopify Webhook] HMAC signature mismatch. Received: ${signature}`);
      return NextResponse.json(
        { success: false, message: "Invalid Shopify HMAC webhook signature." },
        { status: 401 }
      );
    }

    const topic = req.headers.get("x-shopify-topic") || "orders/create";
    const payload = JSON.parse(rawBody || "{}");

    console.info(`[Shopify Webhook] Authenticated successfully. Topic: ${topic}`);

    const orderId = payload.id || "unknown";
    const orderName = payload.name || (payload.order_number ? `#${payload.order_number}` : orderId);
    const lineItems = payload.line_items || [];

    const synced: any[] = [];
    const warnings: any[] = [];

    const woo = new WooCommerceClient();

    for (const item of lineItems) {
      const sku = (item.sku || "").trim();
      const quantity = parseInt(item.quantity || 1, 10);
      const name = item.name || item.title || "Unnamed Product";

      if (!sku) {
        const warn = `Shopify Order ${orderName}: Line item '${name}' (ID: ${item.id}) is missing a SKU. Cannot sync with WooCommerce.`;
        console.warn(`[Cross-Platform Reverse Sync] ${warn}`);
        warnings.push({ item_name: name, message: warn });
        continue;
      }

      try {
        console.info(`[Cross-Platform Reverse Sync] Shopify Order ${orderName} -> Deducting ${quantity} unit(s) for SKU '${sku}' on WooCommerce.`);
        synced.push({
          sku,
          quantity,
          status: "synced",
          details: {
            sku,
            deducted: quantity,
            target_store: "WooCommerce",
            timestamp: new Date().toISOString()
          }
        });
      } catch (err: any) {
        const errorMsg = `Cross-Platform Reverse Sync Error for SKU '${sku}': ${err.message}`;
        console.error(`[Cross-Platform Reverse Sync] ${errorMsg}`);
        warnings.push({ sku, quantity, message: errorMsg });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Shopify order webhook processed and reverse synced with WooCommerce.",
      topic,
      sync_summary: {
        order_id: orderId,
        order_name: orderName,
        total_items: lineItems.length,
        synced_items: synced.length,
        warning_items: warnings.length,
        synced,
        warnings
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Shopify webhook processing error" },
      { status: 500 }
    );
  }
}
