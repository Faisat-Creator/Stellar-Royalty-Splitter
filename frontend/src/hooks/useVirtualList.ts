import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export type UseVirtualListOptions = {
  itemCount: number;
  itemHeight: number | ((ref: HTMLElement, index: number) => number);
  overscan?: number;
  containerRef: RefObject<HTMLElement | null>;
  scrollTop?: number;
  onMeasure?: (index: number, height: number) => void;
  enableKeyboardNavigation?: boolean;
};

export type VirtualItem = { index: number; start: number; size: number; offsetTop: number };

export interface UseVirtualListResult {
  totalHeight: number;
  virtualItems: VirtualItem[];
  scrollToIndex: (index: number, align?: "auto" | "top" | "bottom" | "center") => void;
  scrollToOffset: (offset: number) => void;
  measureElement: (index: number) => (element: HTMLElement | null) => void;
  isScrolling: boolean;
  startIndex: number;
  endIndex: number;
}

const DEFAULT_ITEM_HEIGHT = 24;

function itemSize(itemHeight: UseVirtualListOptions["itemHeight"], index: number, element?: HTMLElement | null): number {
  if (typeof itemHeight === "number") return itemHeight;
  return element ? Math.max(1, itemHeight(element, index)) : DEFAULT_ITEM_HEIGHT;
}

export default function useVirtualList({
  itemCount,
  itemHeight,
  overscan = 5,
  containerRef,
  scrollTop: externalScrollTop,
  onMeasure,
  enableKeyboardNavigation = false,
}: UseVirtualListOptions): UseVirtualListResult {
  const sizesRef = useRef<number[]>([]);
  const container = containerRef.current;
  const [scrollTop, setScrollTop] = useState(externalScrollTop ?? 0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [virtualItems, setVirtualItems] = useState<VirtualItem[]>([]);
  const [range, setRange] = useState({ start: 0, end: 0 });
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getSizes = useCallback(() => {
    return Array.from({ length: itemCount }, (_, index) => sizesRef.current[index] ?? itemSize(itemHeight, index));
  }, [itemCount, itemHeight]);

  const totalHeight = getSizes().reduce((sum, size) => sum + size, 0);

  const calculate = useCallback(() => {
    const sizes = getSizes();
    const viewport = container?.clientHeight || 600;
    const offset = externalScrollTop ?? scrollTop;
    let cursor = 0;
    let start = 0;
    while (start < itemCount && cursor + sizes[start] <= offset) {
      cursor += sizes[start];
      start += 1;
    }
    const first = Math.max(0, start - overscan);
    let end = start;
    let visible = 0;
    while (end < itemCount && visible < viewport) {
      visible += sizes[end];
      end += 1;
    }
    end = Math.min(itemCount, end + overscan);
    let position = sizes.slice(0, first).reduce((sum, size) => sum + size, 0);
    const items: VirtualItem[] = [];
    for (let index = first; index < end; index += 1) {
      const size = sizes[index];
      items.push({ index, start: position, size, offsetTop: position });
      position += size;
    }
    setVirtualItems(items);
    setRange({ start: first, end });
  }, [container, externalScrollTop, getSizes, itemCount, overscan, scrollTop]);

  useLayoutEffect(() => { calculate(); }, [calculate, itemCount]);

  useEffect(() => {
    const element = container;
    if (!element) return;
    const onScroll = () => {
      setScrollTop(element.scrollTop);
      setIsScrolling(true);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 120);
      calculate();
    };
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", onScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [calculate, container]);

  useEffect(() => {
    if (externalScrollTop !== undefined) {
      setScrollTop(externalScrollTop);
      calculate();
    }
  }, [calculate, externalScrollTop]);

  const scrollToOffset = useCallback((offset: number) => {
    if (!container) return;
    const next = Math.max(0, Math.min(offset, Math.max(0, totalHeight - container.clientHeight)));
    container.scrollTop = next;
    setScrollTop(next);
  }, [container, totalHeight]);

  const scrollToIndex = useCallback((index: number, align: "auto" | "top" | "bottom" | "center" = "auto") => {
    if (!container || itemCount === 0) return;
    const bounded = Math.max(0, Math.min(index, itemCount - 1));
    const sizes = getSizes();
    const start = sizes.slice(0, bounded).reduce((sum, size) => sum + size, 0);
    const size = sizes[bounded];
    const viewport = container.clientHeight;
    const current = container.scrollTop;
    const next = align === "top" ? start : align === "bottom" ? start + size - viewport : align === "center" ? start + (size - viewport) / 2 : start < current ? start : start + size > current + viewport ? start + size - viewport : current;
    scrollToOffset(next);
  }, [container, getSizes, itemCount, scrollToOffset]);

  const measureElement = useCallback((index: number) => (element: HTMLElement | null) => {
    if (!element) return;
    const measured = Math.max(1, element.getBoundingClientRect().height);
    if (sizesRef.current[index] !== measured) {
      sizesRef.current[index] = measured;
      onMeasure?.(index, measured);
      calculate();
    }
  }, [calculate, onMeasure]);

  useEffect(() => {
    if (!enableKeyboardNavigation || !container) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Home") { event.preventDefault(); scrollToIndex(0, "top"); }
      if (event.key === "End") { event.preventDefault(); scrollToIndex(itemCount - 1, "bottom"); }
      if (event.key === "PageUp") { event.preventDefault(); scrollToIndex(Math.max(0, range.start - 1), "top"); }
      if (event.key === "PageDown") { event.preventDefault(); scrollToIndex(Math.min(itemCount - 1, range.end), "top"); }
    };
    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  }, [container, enableKeyboardNavigation, itemCount, range, scrollToIndex]);

  return { totalHeight, virtualItems, scrollToIndex, scrollToOffset, measureElement, isScrolling, startIndex: range.start, endIndex: range.end };
}
