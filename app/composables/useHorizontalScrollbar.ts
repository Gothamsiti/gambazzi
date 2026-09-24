type ScrollRootRefValue =
    | HTMLElement
    | {
          $el?: HTMLElement | null;
          nodeType?: number;
      }
    | null;

type MaybeEnabled = Ref<boolean> | ComputedRef<boolean> | boolean | undefined;

interface UseHorizontalScrollbarOptions {
    scrollRoot: Ref<ScrollRootRefValue>;
    trackRef: Ref<HTMLElement | null>;
    enabled?: MaybeEnabled;
}

function resolveEnabled(enabled: MaybeEnabled): boolean {
    if (typeof enabled === 'boolean') return enabled;
    return enabled?.value ?? true;
}

export function useHorizontalScrollbar({ scrollRoot, trackRef, enabled }: UseHorizontalScrollbarOptions) {
    const {sizes,scroll} = useSizes();
    const showScrollbar = ref(false);
    const thumb = ref({ width: 100, left: 0 });
    const canScrollLeft = ref(false);
    const canScrollRight = ref(false);

    const thumbStyle = computed(() => ({
        width: thumb.value.width + '%',
        left: thumb.value.left + '%'
    }));

    const getScrollEl = (): HTMLElement | null => {
        const root = scrollRoot.value;
        if (!root) return null;
        if (root instanceof HTMLElement) return root;
        return root.$el ?? null;
    };

    let rafPending = false;
    const updateThumb = (): void => {
        rafPending = false;
        const el = getScrollEl();
        if (!el || !resolveEnabled(enabled)) {
            showScrollbar.value = false;
            canScrollLeft.value = false;
            canScrollRight.value = false;
            return;
        }

        const { scrollWidth, clientWidth, scrollLeft } = el;
        if (scrollWidth <= clientWidth + 1) {
            showScrollbar.value = false;
            canScrollLeft.value = false;
            canScrollRight.value = false;
            return;
        }

        showScrollbar.value = true;
        const width = (clientWidth / scrollWidth) * 100;
        const maxLeft = 100 - width;
        const left = (scrollLeft / (scrollWidth - clientWidth)) * maxLeft;
        thumb.value = { width, left };

        const epsilon = 1;
        const maxScroll = scrollWidth - clientWidth;
        canScrollLeft.value = scrollLeft > epsilon;
        canScrollRight.value = scrollLeft < maxScroll - epsilon;
    };

    const requestUpdateThumb = (): void => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(updateThumb);
    };

    let dragging = false;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;
    let dragScrollRatio = 0;
    let dragRafId: number | undefined;
    let pendingPointerX = 0;

    const updateDragPosition = (): void => {
        dragRafId = undefined;
        if (!dragging) return;

        const el = getScrollEl();
        if (!el) return;

        el.scrollLeft = dragStartScrollLeft + (pendingPointerX - dragStartX) * dragScrollRatio;
        updateThumb();
    };

    const onPointerMove = (e: PointerEvent): void => {
        if (!dragging) return;

        pendingPointerX = e.clientX;
        if (dragRafId === undefined) {
            dragRafId = requestAnimationFrame(updateDragPosition);
        }
    };

    const onPointerUp = (): void => {
        dragging = false;
        if (dragRafId !== undefined) {
            cancelAnimationFrame(dragRafId);
            dragRafId = undefined;
        }
        requestUpdateThumb();
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
    };

    const onThumbPointerDown = (e: PointerEvent): void => {
        e.preventDefault();
        e.stopPropagation();

        const el = getScrollEl();
        if (!el) return;

        const track = trackRef.value;
        if (!track) return;

        const scrollableWidth = el.scrollWidth - el.clientWidth;
        const draggableTrackWidth = track.clientWidth - (thumb.value.width / 100) * track.clientWidth;
        if (draggableTrackWidth <= 0) return;

        dragging = true;
        dragStartX = e.clientX;
        dragStartScrollLeft = el.scrollLeft;
        dragScrollRatio = scrollableWidth / draggableTrackWidth;

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    const onTrackPointerDown = (e: PointerEvent): void => {
        e.stopPropagation();
    };

    const onTrackClick = (e: MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();

        const el = getScrollEl();
        const track = trackRef.value;
        if (!el || !track) return;

        const rect = track.getBoundingClientRect();
        const clickRatio = (e.clientX - rect.left) / rect.width;
        el.scrollLeft = clickRatio * el.scrollWidth - el.clientWidth / 2;
    };

    const moveScroll = (direction: number): void => {
        const el = getScrollEl();
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 0) return;

        let children = Array.from(el.children) as HTMLElement[];
        const onlyChild = children.length === 1 ? children[0] : undefined;
        if (onlyChild && onlyChild.children.length) {
            children = Array.from(onlyChild.children) as HTMLElement[];
        }
        if (!children.length) return;

        const containerRect = el.getBoundingClientRect();
        const epsilon = 1;

        if (direction > 0) {
            if (el.scrollLeft >= maxScroll - epsilon) return;
            const target = children.find((child) => child.getBoundingClientRect().right > containerRect.right + epsilon);
            if (!target) return;
            el.scrollBy({ left: target.getBoundingClientRect().right - containerRect.right, behavior: 'smooth' });
        } else if (direction < 0) {
            if (el.scrollLeft <= epsilon) return;
            const target = [...children].reverse().find((child) => child.getBoundingClientRect().left < containerRect.left - epsilon);
            if (!target) return;
            el.scrollBy({ left: target.getBoundingClientRect().left - containerRect.left, behavior: 'smooth' });
        }
    };

    let resizeObserver: ResizeObserver | undefined;
    const onScroll = (): void => {
        if (!dragging) requestUpdateThumb();
    };

    onMounted(() => {
        const el = getScrollEl();
        if (!el) return;

        updateThumb();
        

        el.addEventListener('scroll', onScroll, { passive: true });
        el.addEventListener('load', requestUpdateThumb, true);
        window.addEventListener('resize', requestUpdateThumb);

        if (window.ResizeObserver) {
            resizeObserver = new ResizeObserver(requestUpdateThumb);
            resizeObserver.observe(el);
        }
    });

    onBeforeUnmount(() => {
        const el = getScrollEl();
        if (el) {
            el.removeEventListener('scroll', onScroll);
            el.removeEventListener('load', requestUpdateThumb, true);
        }

        window.removeEventListener('resize', requestUpdateThumb);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        if (dragRafId !== undefined) cancelAnimationFrame(dragRafId);
        resizeObserver?.disconnect();
    });

    return {
        showScrollbar,
        thumbStyle,
        onThumbPointerDown,
        onTrackPointerDown,
        onTrackClick,
        requestUpdateThumb,
        getScrollEl,
        moveScroll,
        canScrollLeft,
        canScrollRight
    };
}