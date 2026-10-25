import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

type ReviewRow = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string | Date;
};

function formatReview(review: ReviewRow) {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: new Date(review.createdAt).toISOString(),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const restaurantId = Number(id);
  if (!Number.isSafeInteger(restaurantId) || restaurantId < 1) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const sql = neon(databaseUrl);
  const restaurants = await sql`
    SELECT id, name, cuisine, area FROM restaurants WHERE id = ${restaurantId} LIMIT 1
  `;
  if (restaurants.length === 0) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const [summary] = await sql`
    SELECT
      ROUND(AVG(rating)::numeric, 1)::double precision AS "averageRating",
      COUNT(*)::integer AS "totalReviews"
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
  `;
  const rows = (await sql`
    SELECT id, rating, comment, created_at AS "createdAt"
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
    ORDER BY created_at DESC, id DESC
  `) as ReviewRow[];
  const formattedReviews = rows.map(formatReview);
  const [latestReview = null, ...olderReviews] = formattedReviews;

  return NextResponse.json({
    name: restaurants[0].name,
    cuisine: restaurants[0].cuisine,
    area: restaurants[0].area,
    averageRating:
      summary.averageRating === null ? null : Number(summary.averageRating),
    totalReviews: Number(summary.totalReviews),
    latestReview,
    reviews: olderReviews,
  });
}
