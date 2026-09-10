import { NextResponse } from "next/server";
import { Database } from "@/lib/db";

export async function GET() {
  const org = Database.getOrganizations()[0];
  const docs = Database.getKnowledgeDocs(org.id);

  return NextResponse.json({
    success: true,
    data: docs,
    meta: {
      total: docs.length,
      organization_id: org.id
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const org = Database.getOrganizations()[0];

    const newDoc = Database.createKnowledgeDoc({
      organization_id: org.id,
      title: body.title,
      type: body.type || "Policy",
      status: "Active",
      size: body.size || "1.2 MB",
      content: body.content || `Parsed text contents of ${body.title}. Includes approved policies, parameters and FAQs.`
    });

    return NextResponse.json({
      success: true,
      data: newDoc
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
