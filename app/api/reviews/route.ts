import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const payload =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};

  const { rating, comment, restaurantId } = payload;

  if (!Number.isInteger(rating) || Number(rating) < 1 || Number(rating) > 5) {
    return NextResponse.json(
      { error: "Rating must be a whole number from 1 to 5." },
      { status: 400 },
    );
  }

  if (typeof comment !== "string" || comment.trim().length === 0) {
    return NextResponse.json(
      { error: "Comment must not be empty." },
      { status: 400 },
    );
  }

  if (!Number.isSafeInteger(restaurantId) || Number(restaurantId) < 1) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 400 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const sql = neon(databaseUrl);
  const restaurants = await sql`
    SELECT id FROM restaurants WHERE id = ${restaurantId} LIMIT 1
  `;
  if (restaurants.length === 0) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 400 });
  }

  const reviews = await sql`
    INSERT INTO reviews (restaurant_id, rating, comment)
    VALUES (${restaurantId}, ${rating}, ${comment.trim()})
    RETURNING id
  `;

  return NextResponse.json(
    { success: true, reviewId: reviews[0].id },
    { status: 201 },
  );
}
