import { NextResponse } from "next/server";
import { Database } from "@/lib/db";
import { RagPipeline } from "@/lib/rag-pipeline";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, message: "Query parameter is required" },
        { status: 400 }
      );
    }

    const org = Database.getOrganizations()[0];
    const result = await RagPipeline.search(org.id, query, 0.65);

    if (result.match) {
      return NextResponse.json({
        success: true,
        data: {
          query,
          match: true,
          source: result.source,
          similarity: result.score,
          chunk: result.chunk,
          section: result.section,
          allMatches: result.allMatches
        }
      });
    }

    // Out-of-domain / irrelevant query strictly rejected
    return NextResponse.json({
      success: true,
      data: {
        query,
        match: false,
        source: "None (Out of Domain)",
        similarity: result.score,
        chunk: result.refusalMessage,
        refusal: result.refusalMessage
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
