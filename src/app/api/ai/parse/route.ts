import { NextRequest, NextResponse } from "next/server";
import { parseTask } from "@/lib/parse-task";
import { AIParseSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const parseResult = AIParseSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        { error: firstIssue.message, code: "VALIDATION_ERROR", field: firstIssue.path.join(".") },
        { status: 400 }
      );
    }

    const { text } = parseResult.data;

    let result: { title: string; deadline?: Date };
    try {
      result = parseTask(text, new Date());
    } catch {
      return NextResponse.json(
        { error: "Could not extract task title from input", code: "PARSE_ERROR" },
        { status: 422 }
      );
    }

    const response: { title: string; deadline?: string; status: "PENDING" } = {
      title: result.title,
      status: "PENDING",
    };

    if (result.deadline) {
      response.deadline = result.deadline.toISOString();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/ai/parse unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
