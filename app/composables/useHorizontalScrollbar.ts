type ScrollRootRefValue =
    | HTMLElement
    | {
          $el?: HTMLElement | null;
          nodeType?: number;
      }
    | null;

type MaybeBoolean = Ref<boolean> | ComputedRef<boolean> | boolean | undefined;

interface UseHorizontalScrollbarOptions {
    scrollRoot: Ref<ScrollRootRefValue>;
    trackRef?: Ref<HTMLElement | null>;
    enabled?: MaybeBoolean;
    // true: navigazione con le frecce, false: scrollbar custom
    arrows?: MaybeBoolean;
}

function resolveBoolean(value: MaybeBoolean, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;
    return value?.value ?? fallback;
}

export function useHorizontalScrollbar({ scrollRoot, trackRef, enabled, arrows }: UseHorizontalScrollbarOptions) {
    const scrollable = ref(false);
    const useArrows = computed(() => resolveBoolean(arrows, false));
    const showScrollbar = computed(() => scrollable.value && !useArrows.value);
    const showArrows = computed(() => scrollable.value && useArrows.value);
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

    // box del contenitore rispetto al suo offsetParent: serve ad allineargli le frecce sopra
    const overlayRect = ref({ top: 0, left: 0, width: 0 });
    const arrowsStyle = computed(() => ({
        top: overlayRect.value.top + 'px',
        left: overlayRect.value.left + 'px',
        width: overlayRect.value.width + 'px',
    }));
    // il box cambia solo con resize e cambi di layout, non con lo scroll: si rilegge solo quando serve
    let rectDirty = true;

    let rafPending = false;
    const update = (): void => {
        rafPending = false;
        const el = getScrollEl();
        const { scrollWidth = 0, clientWidth = 0, scrollLeft = 0 } = el ?? {};
        if (!el || !resolveBoolean(enabled, true) || scrollWidth <= clientWidth + 1) {
            scrollable.value = false;
            canScrollLeft.value = false;
            canScrollRight.value = false;
            return;
        }

        scrollable.value = true;
        if (rectDirty) {
            rectDirty = false;
            overlayRect.value = { top: el.offsetTop, left: el.offsetLeft, width: el.offsetWidth };
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

    const requestUpdate = (): void => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(update);
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
        update();
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
        requestUpdate();
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
    };

    const onThumbPointerDown = (e: PointerEvent): void => {
        e.preventDefault();
        e.stopPropagation();

        const el = getScrollEl();
        if (!el) return;

        const track = trackRef?.value;
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
        const track = trackRef?.value;
        if (!el || !track) return;

        const rect = track.getBoundingClientRect();
        const clickRatio = (e.clientX - rect.left) / rect.width;
        el.scrollLeft = clickRatio * el.scrollWidth - el.clientWidth / 2;
    };

    // figli "reali" del contenitore: i wrapper con display: contents (es. .BodyColsWrap) non hanno un box,
    // quindi si scende ai loro figli
    const getItems = (parent: Element): HTMLElement[] =>
        (Array.from(parent.children) as HTMLElement[]).flatMap((child) =>
            getComputedStyle(child).display === 'contents' ? getItems(child) : [child]
        );

    const moveScroll = (direction: number): void => {
        const el = getScrollEl();
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 0) return;

        let children = getItems(el);
        const onlyChild = children.length === 1 ? children[0] : undefined;
        if (onlyChild && onlyChild.children.length) {
            children = getItems(onlyChild);
        }

        const containerRect = el.getBoundingClientRect();
        const epsilon = 1;
        // senza un elemento a cui agganciarsi si scorre di una larghezza del contenitore
        const fallback = el.clientWidth * Math.sign(direction);

        if (direction > 0) {
            if (el.scrollLeft >= maxScroll - epsilon) return;
            const target = children.find((child) => child.getBoundingClientRect().right > containerRect.right + epsilon);
            const left = target ? target.getBoundingClientRect().right - containerRect.right : fallback;
            el.scrollBy({ left, behavior: 'smooth' });
        } else if (direction < 0) {
            if (el.scrollLeft <= epsilon) return;
            const target = [...children].reverse().find((child) => child.getBoundingClientRect().left < containerRect.left - epsilon);
            const left = target ? target.getBoundingClientRect().left - containerRect.left : fallback;
            el.scrollBy({ left, behavior: 'smooth' });
        }
    };

    let resizeObserver: ResizeObserver | undefined;
    const onScroll = (): void => {
        if (!dragging) requestUpdate();
    };
    const onLayoutChange = (): void => {
        rectDirty = true;
        requestUpdate();
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
        update();
    };

    onMounted(() => {
        bind(getScrollEl());
        window.addEventListener('resize', onLayoutChange);
        // il contenitore può cambiare elemento dopo il mount (es. BodyCols passa da NuxtLink a section con l'editor)
        watch(getScrollEl, bind, { flush: 'post' });
        // cambiando modalità cambia il layout attorno al contenitore: si riallinea il box delle frecce
        watch(useArrows, onLayoutChange, { flush: 'post' });
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
        showArrows,
        thumbStyle,
        arrowsStyle,
        onThumbPointerDown,
        onTrackPointerDown,
        onTrackClick,
        requestUpdate,
        getScrollEl,
        moveScroll,
        canScrollLeft,
        canScrollRight
    };
}
