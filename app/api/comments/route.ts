import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { photoId, content } = await req.json();

    if (!photoId || !content) {
      return NextResponse.json(
        { error: "Missing requirements" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: { photoId, content },
    });

    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}
