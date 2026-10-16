import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

type SplitType = 'lines' | 'words' | 'chars';

interface AnimationProperty {
    key: string;
    from: unknown;
    to: unknown;
}

interface AnimationItem {
    type?: string;
    start?: string;
    end?: string;
    scrub?: boolean | number;
    markers?: boolean;
    mask?: boolean;
    delay?: number;
    properties?: AnimationProperty[];
    stagger?: number | object;
    scrollTrigger?: boolean;
    duration?: number;
    limit?: number;
    belowLimit?: number;
    reverse?: boolean;
    triggerOverride?: string;
}

interface SplitTextConfig {
    type: string;
    mask?: SplitType;
    linesClass?: string;
    wordsClass?: string;
    charsClass?: string;
    aria?: 'auto' | 'hidden' | 'none';
}

interface SplitTextResult {
    lines?: gsap.TweenTarget;
    words?: gsap.TweenTarget;
    chars?: gsap.TweenTarget;
}

interface GsapConfig {
    delay?: number;
    stagger?: number | object;
    scrollTrigger?: {
        trigger: gsap.TweenTarget;
        start?: string;
        end?: string;
        scrub?: boolean | number;
        markers?: boolean;
        delay?: number;
        toggleActions?: string;
        invalidateOnRefresh?: boolean;
    };
    [key: string]: unknown;
}

const splitTypes: SplitType[] = ['lines', 'words', 'chars'];

function isSplitType(value: string | undefined): value is SplitType {
    return value !== undefined && splitTypes.includes(value as SplitType);
}

// figli visivi di un elemento: i wrapper in display: contents (es. BodyColsWrap) non hanno un box,
// quindi si scende ai loro figli
function getRealChildren(el: Element): Element[] {
    const result: Element[] = [];
    for (const child of Array.from(el.children)) {
        if (getComputedStyle(child).display === 'contents') {
            result.push(...getRealChildren(child));
        } else {
            result.push(child);
        }
    }
    return result;
}

// radici da dare a SplitText: un inline-block non può essere spezzato su più righe, quindi se un figlio
// contiene soltanto un wrapper inline-block (es. h3 > span.h1 generato dal richtext) si divide dal wrapper
function getSplitRoots(el: Element): Element[] {
    return Array.from(el.children).map((child) => {
        let node: Element = child;
        while (node.children.length === 1) {
            const only = node.firstElementChild as Element;
            const hasOwnText = Array.from(node.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
            if (hasOwnText || getComputedStyle(only).display !== 'inline-block') break;
            node = only;
        }
        return node;
    });
}

// ogni refresh ricalcola start/end di tutti gli ScrollTrigger della pagina e forza un layout:
// le richieste dei componenti montati nello stesso ciclo confluiscono in un solo refresh al frame successivo
let refreshQueued = false;
export function scheduleScrollTriggerRefresh(): void {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
        refreshQueued = false;
        ScrollTrigger.refresh();
    });
}

export function useAnimations($el: HTMLElement, blok: any, animations: AnimationItem[] = [], animationsEndCallback?: () => void, animationsInitedCallback?: () => void): () => void {
    if (!animations.length) {
        animationsEndCallback?.();
        return () => {};
    }

    const { sizes } = useSizes();

    let completedAnimations = 0;
    const totalAnimations = animations.length;
    let callbackCalled = false;
    let hasScrollTrigger = false;

    const onAnimationComplete = (): void => {
        if (callbackCalled) {
            return;
        }

        completedAnimations += 1;
        if (completedAnimations >= totalAnimations) {
            callbackCalled = true;
            animationsEndCallback?.();
        }
    };
    const buildAnimations = () => gsap.context(() => {
        animationsInitedCallback?.();
            const refWidth = sizes.value.width || window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            const isSkipped = ({ limit, belowLimit }: AnimationItem): boolean => {
                const bl = parseInt(belowLimit as unknown as string, 10);
                const li = parseInt(limit as unknown as string, 10);
                return (limit !== undefined && refWidth <= li) || (belowLimit !== undefined && refWidth > bl);
            };

            // un nuovo SplitText sugli stessi elementi ripristina l'HTML originale e stacca dal DOM i pezzi
            // della split precedente: si divide una sola volta con tutti i tipi richiesti (es. "lines,words")
            // e ogni animazione prende la sua parte
            const splitAnimations = animations.filter((a) => isSplitType(a.type) && !isSkipped(a));
            // getComputedStyle dopo le scritture della SplitText forza un ricalcolo degli stili: i figli reali
            // si leggono una volta e si rileggono solo se la split ha cambiato il DOM
            let realChildren: Element[] | undefined;
            const getRealChildrenOnce = (): Element[] => (realChildren ??= getRealChildren($el));

            let splitted: SplitTextResult | undefined;
            const getSplitted = (): SplitTextResult => {
                if (splitted) return splitted;
                const types = splitTypes.filter((t) => splitAnimations.some((a) => a.type === t));
                const splittingConfig: SplitTextConfig = { type: types.join(','), aria: "none" };
                // SplitText accetta un solo tipo di mask: vale la prima animazione che lo richiede
                const masked = splitAnimations.find((a) => a.mask);
                if (masked && isSplitType(masked.type)) {
                    splittingConfig.mask = masked.type;
                }
                if (types.includes('lines')) splittingConfig.linesClass = 'lines';
                if (types.includes('words')) splittingConfig.wordsClass = 'words';
                if (types.includes('chars')) splittingConfig.charsClass = 'chars';
                splitted = new SplitText(getSplitRoots($el), splittingConfig) as SplitTextResult;
                realChildren = undefined;
                return splitted;
            };

            for (const animation of animations) {
                const { type, start, end, scrub, duration, markers, delay, properties, stagger, scrollTrigger, reverse, triggerOverride } = animation;
                if (isSkipped(animation)) {
                    onAnimationComplete();
                    continue;
                }
                const simpleText = type == 'image' ? $el.querySelectorAll('img') : $el.children;
                const config: GsapConfig = {};
                if (scrollTrigger) {
                    hasScrollTrigger = true;
                    // triggerOverride: id di un altro elemento da usare come trigger dello scroll
                    const overrideTrigger = triggerOverride ? document.getElementById(triggerOverride.replace(/^#/, '')) : null;
                    // un wrapper in display: contents non ha box (getBoundingClientRect vuoto): come trigger
                    // si usano i figli reali, altrimenti ScrollTrigger calcola start/end sbagliati
                    config.scrollTrigger = {
                        trigger: overrideTrigger ?? (type == 'image' ? simpleText : getRealChildrenOnce()),
                        start,
                        end,
                        scrub,
                        markers,
                        delay,
                        toggleActions: reverse ? "play none none reverse" : "play none none none"
                    };
                }
                if (delay) {
                    config.delay = delay;
                }
                if (duration) {
                    config.duration = duration;
                }

                const from: Record<string, unknown> = {};
                const to: Record<string, unknown> & Pick<GsapConfig, 'stagger'> = {};
                if (stagger) {
                    to.stagger = stagger;
                }
                if (properties) {
                    for (const prop of properties) {
                        from[prop.key] = prop.from;
                        to[prop.key] = prop.to;
                    }
                }
                const target: gsap.TweenTarget = isSplitType(type)
                    ? (getSplitted()[type] ?? simpleText)
                    : type === 'childs' ? getRealChildrenOnce() : simpleText;
                gsap.fromTo(target, from, { ...to, ...config, onComplete: onAnimationComplete } as gsap.TweenVars);
            }
    }, $el);

    let ctx: gsap.Context | undefined;
    ctx = buildAnimations();
    if (hasScrollTrigger) scheduleScrollTriggerRefresh();

    return () => {
        ctx?.revert();
    };
}