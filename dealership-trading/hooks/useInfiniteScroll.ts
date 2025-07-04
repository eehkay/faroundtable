import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  threshold?: number
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 100
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0]
    if (target.isIntersecting && hasMore && !isLoading) {
      onLoadMore()
    }
  }, [hasMore, isLoading, onLoadMore])

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0
    }

    observerRef.current = new IntersectionObserver(handleObserver, option)

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleObserver, threshold])

  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (loadMoreRef.current) {
      if (observerRef.current) {
        observerRef.current.unobserve(loadMoreRef.current)
      }
    }

    loadMoreRef.current = node

    if (node && observerRef.current) {
      observerRef.current.observe(node)
    }
  }, [])

  return { setLoadMoreRef }
}