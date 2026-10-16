import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { scheduleScrollTriggerRefresh } from '~/composables/useAnimations';

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    gsap.registerPlugin(ScrollTrigger, SplitText);

    if(config?.public?.normalizeScroll) {
        ScrollTrigger.normalizeScroll({ type: 'touch', allowNestedScroll: true });
    }

    document.fonts?.ready.then(scheduleScrollTriggerRefresh);
    const { sizes } = useSizes();
    let lastWidth = sizes.value.width || window.innerWidth;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    watch(() => sizes.value.height, () => {
        const width = sizes.value.width;
        if (width !== lastWidth) {
            lastWidth = width;
            return;
        }
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(scheduleScrollTriggerRefresh, 150);
    });
});
