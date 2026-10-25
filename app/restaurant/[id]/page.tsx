"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

type Restaurant = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
};

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/restaurants/${id}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load this restaurant.");
        return data as Restaurant;
      })
      .then(setRestaurant)
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name !== "AbortError") {
          setError(cause.message);
        }
      });

    return () => controller.abort();
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[560px] px-6 py-16">
        <p className="text-sm text-[#77736b]">Could not load the restaurant</p>
        <p className="mt-3">{error}</p>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[560px] px-6 py-16">
        <p className="text-sm text-[#77736b]">Loading restaurant…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[560px] px-6 py-12 sm:py-16">
      <header className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a4e2b]">
          Restaurant
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {restaurant.name}
        </h1>
        <p className="mt-3 text-sm text-[#77736b]">
          {restaurant.cuisine} <span aria-hidden="true">·</span> {restaurant.area}
        </p>
      </header>

      <section aria-label="Average rating" className="mb-10 border-y border-[#e7e3da] py-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#77736b]">
          Average rating
        </p>
        <div className="flex items-baseline gap-3">
          <span className="text-6xl font-semibold leading-none tracking-[-0.06em] sm:text-7xl">
            {restaurant.averageRating === null ? "—" : restaurant.averageRating}
          </span>
          <span className="text-sm text-[#77736b]">
            {restaurant.totalReviews} reviews
          </span>
        </div>
      </section>

      {restaurant.latestReview ? (
        <section aria-labelledby="latest-review-heading" className="mb-10">
          <h2
            id="latest-review-heading"
            className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#77736b]"
          >
            Latest review
          </h2>
          <article className="rounded-2xl border border-[#e7e3da] bg-white p-6">
            <p className="mb-3 text-sm font-medium text-[#9a4e2b]">
              {restaurant.latestReview.rating} / 5
            </p>
            <p className="text-lg leading-7">{restaurant.latestReview.comment}</p>
            <time className="mt-5 block text-xs text-[#77736b]">
              {new Date(restaurant.latestReview.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
          </article>
        </section>
      ) : (
        <section className="mb-10 rounded-2xl border border-dashed border-[#d8d1c5] p-6">
          <h2 className="text-lg font-medium">Be the first to leave a review</h2>
          <p className="mt-2 text-sm leading-6 text-[#77736b]">
            Tell others what you thought of Ludhiana Burrito.
          </p>
        </section>
      )}

      {restaurant.reviews.length > 0 && (
        <section aria-labelledby="older-reviews-heading" className="mb-10">
          <h2
            id="older-reviews-heading"
            className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#77736b]"
          >
            Older reviews
          </h2>
          <ul className="divide-y divide-[#e7e3da]">
            {restaurant.reviews.map((review) => (
              <li key={review.id} className="py-5">
                <p className="text-sm font-medium text-[#9a4e2b]">{review.rating} / 5</p>
                <p className="mt-2 leading-6">{review.comment}</p>
                <time className="mt-3 block text-xs text-[#77736b]">
                  {new Date(review.createdAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href={`/review/${id}`}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#9a4e2b] px-5 text-sm font-medium text-white transition-colors hover:bg-[#7f3e21] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a4e2b]"
      >
        Write a review
      </Link>
    </main>
  );
}
