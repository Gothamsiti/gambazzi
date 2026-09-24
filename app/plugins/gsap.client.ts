import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

export default defineNuxtPlugin(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    // type: 'touch' e non il default 'wheel,touch'. Su desktop GSAP non
    // intercetta niente: rotella e trackpad restano nativi, che e' il motivo
    // per cui le prove col contenitore e con Lenis grattavano.
    // Su touch invece prende in carico lo scroll con preventDefault e lo scrive
    // via JS, quindi Safari iOS non ritrae la barra degli indirizzi e la
    // viewport non cambia piu' altezza a meta' scroll.
    // allowNestedScroll tiene funzionante lo scroller orizzontale di BodyCols.
    ScrollTrigger.normalizeScroll({ type: 'touch', allowNestedScroll: true });

    document.fonts?.ready.then(() => ScrollTrigger.refresh());
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
        refreshTimer = setTimeout(() => {
            // Il refresh globale salva e ripristina lo scroll: su iOS uno scrollTop
            // scritto via JS ammazza l'inerzia. Quello per singolo trigger rimisura
            // le stesse geometrie senza toccare la posizione di scroll.
            ScrollTrigger.getAll().forEach(trigger => trigger.refresh());
            ScrollTrigger.update();
        }, 150);
    });
});
