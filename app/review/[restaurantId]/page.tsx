"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

export default function ReviewPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/restaurants/${restaurantId}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load this restaurant.");
        setRestaurantName(data.name as string);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name !== "AbortError") {
          setError(cause.message);
        }
      });

    return () => controller.abort();
  }, [restaurantId]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === null || comment.trim().length === 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: Number(restaurantId), rating, comment }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "The review could not be submitted.");
        return;
      }
      router.push(`/restaurant/${restaurantId}`);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[560px] px-6 py-12 sm:py-16">
      <header className="mb-10 mt-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a4e2b]">
          Write a review
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {restaurantName ?? "Restaurant"}
        </h1>
      </header>

      <form onSubmit={submitReview} className="space-y-8">
        <fieldset>
          <legend className="mb-3 text-sm font-medium">Your rating</legend>
          <div className="flex gap-2" role="group" aria-label="Choose a rating from 1 to 5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                aria-pressed={rating === value}
                onClick={() => setRating(value)}
                className={`flex size-12 items-center justify-center rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a4e2b] ${
                  rating === value
                    ? "border-[#9a4e2b] bg-[#9a4e2b] text-white"
                    : "border-[#e7e3da] bg-white text-[#211f1b] hover:border-[#9a4e2b]"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[#77736b]">{rating === null ? "Select 1 to 5" : `${rating} out of 5`}</p>
        </fieldset>

        <div>
          <label htmlFor="comment" className="mb-3 block text-sm font-medium">
            Your comment
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={6}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What should other diners know?"
            className="w-full resize-y rounded-2xl border border-[#e7e3da] bg-white px-4 py-3 leading-6 outline-none transition-colors placeholder:text-[#9a968d] focus:border-[#9a4e2b]"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-[#d8b6a6] bg-[#fbf1ec] px-4 py-3 text-sm text-[#7f3e21]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={rating === null || comment.trim().length === 0 || submitting}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#9a4e2b] px-5 text-sm font-medium text-white transition-colors hover:bg-[#7f3e21] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a4e2b] disabled:cursor-not-allowed disabled:bg-[#c7b3a7]"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </main>
  );
}
