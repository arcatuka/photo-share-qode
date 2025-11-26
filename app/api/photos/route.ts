import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const photos = await prisma.photo.findMany({
      orderBy: { createdAt: "desc" },
      include: { comments: { orderBy: { createdAt: "desc" } } },
    });
    return NextResponse.json(photos);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { imageData } = await req.json();

    if (!imageData) {
      return NextResponse.json(
        { error: "Image data required" },
        { status: 400 }
      );
    }

    const photo = await prisma.photo.create({
      data: { imageData },
    });

    return NextResponse.json(photo);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}
