"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, SearchX } from "lucide-react";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { useSearchPosts, useSearchUsers } from "@/lib/hooks/use-queries";
import { searchUrl, type SearchTab } from "@/lib/search-tabs";
import { PageContainer } from "@/components/PageContainer";
import { PostCard } from "@/components/PostCard";
import { UserListRow } from "@/components/users/UserListRow";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchTabs } from "@/components/search/SearchTabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import type { components } from "@/lib/api/api";

type Post = components["schemas"]["Post"];

type SearchContentProps = {
  query: string;
  tab: SearchTab;
};

/**
 * The API client puts the raw response body in the error message, so unwrap the
 * error envelope the server sent rather than showing its JSON.
 */
function parseApiError(error: Error | null): { code?: string; message?: string } {
  if (!error) return {};
  try {
    const parsed: unknown = JSON.parse(error.message);
    if (parsed && typeof parsed === "object") {
      const { code, message } = parsed as { code?: unknown; message?: unknown };
      return {
        code: typeof code === "string" ? code : undefined,
        message: typeof message === "string" ? message : undefined,
      };
    }
  } catch {
    // Not a JSON body — a network failure, say. Fall through to the raw text.
  }
  return { message: error.message };
}

/**
 * A boost carries no text of its own, so it can only turn up through a filter
 * like `from:`. Show what was boosted rather than an empty card.
 */
function displayedPost(post: Post): Post {
  const isPureBoost = post.content === "" && !!post.referenceId;
  return isPureBoost && post.reference ? post.reference : post;
}

export function SearchContent({ query, tab }: SearchContentProps) {
  const t = useTranslations("search");
  const tCommon = useTranslations();
  const router = useRouter();

  // Both stay mounted — hooks cannot be called conditionally — and only the
  // visible tab is allowed to fetch.
  const postResults = useSearchPosts(query, tab === "posts");
  const userResults = useSearchUsers(query, tab === "users");
  const active = tab === "posts" ? postResults : userResults;

  const posts = useMemo(
    () => postResults.data?.pages.flatMap((page) => page.items) ?? [],
    [postResults.data],
  );
  const users = useMemo(
    () => userResults.data?.pages.flatMap((page) => page.items) ?? [],
    [userResults.data],
  );
  const resultCount = tab === "posts" ? posts.length : users.length;

  const sentinelRef = useInfiniteScroll({
    enabled: resultCount > 0,
    hasNextPage: Boolean(active.hasNextPage),
    isFetchingNextPage: active.isFetchingNextPage,
    fetchNextPage: active.fetchNextPage,
  });

  const error = (active.error as Error | null) ?? null;

  const apiError = parseApiError(error);

  const renderResults = () => {
    if (apiError.code === "search_unavailable") {
      return <EmptyState icon={SearchX} title={t("unavailable")} />;
    }
    // isPending rather than isLoading: between attempts isLoading drops to
    // false with still no data, which would flash "no results" over a query
    // that has not actually finished.
    if (active.isPending && resultCount === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner variant="theme" label={tCommon("loading")} />
        </div>
      );
    }
    if (error) {
      // A rejected query is something the user can fix, and the server already
      // says how, so show that on its own rather than behind an error banner.
      const isSyntaxError = apiError.code === "invalid_request";
      return (
        <div className="flex items-center justify-center px-4 py-12 text-center">
          <p className="text-destructive">
            {isSyntaxError
              ? apiError.message
              : `${tCommon("error.title")}: ${apiError.message ?? ""}`}
          </p>
        </div>
      );
    }
    if (resultCount === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title={tab === "posts" ? t("noPosts") : t("noUsers")}
        />
      );
    }

    if (tab === "users") {
      return (
        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <UserListRow key={user.id} user={user} />
          ))}
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-xl bg-card sm:rounded-2xl">
        {posts.map((post, index) => (
          <PostCard
            key={post.id}
            post={displayedPost(post)}
            variant="timeline"
            isLast={index === posts.length - 1}
            onUserClick={(username) =>
              router.push(`/users/${encodeURIComponent(username)}`)
            }
          />
        ))}
      </div>
    );
  };

  return (
    // No page header: the search box already says what the page is, and a
    // title above it only pushes the box down.
    <PageContainer maxWidth="2xl">
      <div className="space-y-3">
        <SearchBar query={query} tab={tab} />

        {query ? (
          <>
            <SearchTabs
              value={tab}
              onChange={(next) =>
                // Replace, so flipping tabs does not fill up the back button.
                router.replace(searchUrl(query, next))
              }
            />
            {renderResults()}
            <InfiniteScrollTrigger
              sentinelRef={sentinelRef}
              hasNextPage={Boolean(active.hasNextPage)}
              isFetchingNextPage={active.isFetchingNextPage}
            />
          </>
        ) : (
          <EmptyState icon={Search} title={t("prompt")} />
        )}
      </div>
    </PageContainer>
  );
}
