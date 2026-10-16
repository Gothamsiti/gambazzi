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

    // box del contenitore rispetto al suo offsetParent: serve a sovrapporgli le frecce
    const overlayRect = ref({ top: 0, left: 0, width: 0, height: 0 });
    const arrowsStyle = computed(() => ({
        top: overlayRect.value.top + 'px',
        left: overlayRect.value.left + 'px',
        width: overlayRect.value.width + 'px',
        height: overlayRect.value.height + 'px',
    }));
    // il box cambia solo con resize e cambi di layout, non con lo scroll: si rilegge solo quando serve
    let rectDirty = true;

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
        if (rectDirty) {
            rectDirty = false;
            overlayRect.value = { top: el.offsetTop, left: el.offsetLeft, width: el.offsetWidth, height: el.offsetHeight };
        }
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
    const onLayoutChange = (): void => {
        rectDirty = true;
        requestUpdateThumb();
    };

    let boundEl: HTMLElement | null = null;
    const unbind = (): void => {
        if (!boundEl) return;
        boundEl.removeEventListener('scroll', onScroll);
        boundEl.removeEventListener('load', onLayoutChange, true);
        resizeObserver?.disconnect();
        boundEl = null;
    };
    const bind = (el: HTMLElement | null): void => {
        if (el === boundEl) return;
        unbind();
        if (!el) return;
        boundEl = el;
        el.addEventListener('scroll', onScroll, { passive: true });
        el.addEventListener('load', onLayoutChange, true);
        if (window.ResizeObserver) {
            resizeObserver ??= new ResizeObserver(onLayoutChange);
            resizeObserver.observe(el);
        }
        rectDirty = true;
        updateThumb();
    };

    onMounted(() => {
        bind(getScrollEl());
        window.addEventListener('resize', onLayoutChange);
        // il contenitore può cambiare elemento dopo il mount (es. BodyCols passa da NuxtLink a section con l'editor)
        watch(getScrollEl, bind, { flush: 'post' });
    });

    onBeforeUnmount(() => {
        unbind();
        window.removeEventListener('resize', onLayoutChange);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        if (dragRafId !== undefined) cancelAnimationFrame(dragRafId);
    });

    return {
        showScrollbar,
        thumbStyle,
        arrowsStyle,
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