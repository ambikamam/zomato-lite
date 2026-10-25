import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Check your .env.local file.");
}

const sql = neon(databaseUrl);
const existingTables = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = current_schema()
    AND table_name IN ('restaurants', 'reviews')
`;
const tableNames = new Set(existingTables.map((row) => row.table_name));

if (tableNames.size === 0) {
  const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  for (const statement of schema.split(";").map((part) => part.trim()).filter(Boolean)) {
    await sql.query(statement);
  }
} else if (tableNames.size !== 2) {
  throw new Error("The database has only part of the expected schema. Check the tables before continuing.");
}

let restaurantRows = await sql`
  SELECT id FROM restaurants
  WHERE name = 'Ludhiana Burrito' AND cuisine = 'Indian' AND area = 'Sector 32'
  ORDER BY id
  LIMIT 1
`;
if (restaurantRows.length === 0) {
  restaurantRows = await sql`
    INSERT INTO restaurants (name, cuisine, area)
    VALUES ('Ludhiana Burrito', 'Indian', 'Sector 32')
    RETURNING id
  `;
}
const restaurantId = restaurantRows[0].id;

const seedReviews = [
  { rating: 5, comment: "Paneer burrito is unreal", daysAgo: 8 },
  { rating: 4, comment: "Good, but slow service", daysAgo: 6 },
  { rating: 4, comment: "Solid. Would repeat.", daysAgo: 2 },
];
for (const review of seedReviews) {
  const existingReviews = await sql`
    SELECT id FROM reviews
    WHERE restaurant_id = ${restaurantId} AND comment = ${review.comment}
    LIMIT 1
  `;
  if (existingReviews.length === 0) {
    await sql`
      INSERT INTO reviews (restaurant_id, rating, comment, created_at)
      VALUES (
        ${restaurantId},
        ${review.rating},
        ${review.comment},
        NOW() - (${review.daysAgo} * INTERVAL '1 day')
      )
    `;
  }
}

const restaurants = await sql`SELECT id, name, cuisine, area FROM restaurants ORDER BY id`;
const reviews = await sql`
  SELECT id, restaurant_id, rating, comment, created_at
  FROM reviews
  ORDER BY created_at DESC
`;
console.log("Restaurants:", JSON.stringify(restaurants, null, 2));
console.log("Reviews:", JSON.stringify(reviews, null, 2));
