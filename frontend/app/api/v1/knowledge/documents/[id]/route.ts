import { NextResponse } from "next/server";
import { Database } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const org = Database.getOrganizations()[0];
    const docs = Database.getKnowledgeDocs(org.id);
    const doc = docs.find((d) => d.id === id);

    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: doc
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const org = Database.getOrganizations()[0];
    const body = await request.json();

    const updated = Database.updateKnowledgeDoc(org.id, id, body);
    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.message?.includes("not found") ? 404 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const org = Database.getOrganizations()[0];

    const deleted = Database.deleteKnowledgeDoc(org.id, id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Document not found or already removed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Document ${id} successfully removed from vector index and knowledge base.`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
