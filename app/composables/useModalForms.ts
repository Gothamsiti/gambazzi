const FORMS_FOLDER = 'system/forms/';

type FormStory = {
    slug: string;
    full_slug: string;
    uuid: string;
    [key: string]: unknown;
};

// Il listener delegato va registrato una sola volta per l'intera app.
let clickListenerInstalled = false;

export const useModalForms = () => {
    const { modalOpen } = useAppLayout();

    // Indice delle storie di tipo form sotto system/forms/, caricato una volta.
    const forms = useState<Record<string, FormStory>>('modalForms', () => ({}));
    const activeKey = useState<string | null>('modalActiveKey', () => null);

    const normalizeHash = (hash?: string | null): string =>
        (hash ?? '').replace(/^#/, '').trim().replace(/^\/+|\/+$/g, '');

    const loadForms = async (): Promise<Record<string, FormStory>> => {
        if (Object.keys(forms.value).length) return forms.value;
        try {
            const res = await $fetch<FormStory[] | { stories: FormStory[] }>('/api/storyblok/request', {
                query: { starts_with: FORMS_FOLDER, per_page: 100 }
            });
            const stories = Array.isArray(res) ? res : res?.stories ?? [];
            const map: Record<string, FormStory> = {};
            for (const story of stories) {
                if (!story?.slug) continue;
                // Match sull'ultimo segmento dello slug (es. hash "#email" -> slug "email").
                map[story.slug] = story;
                // Fallback sul full_slug completo, non vincolante per gli editor.
                map[normalizeHash(story.full_slug)] = story;
            }
            forms.value = map;
        } catch (error) {
            console.error("[useModalForms] impossibile caricare l'indice dei form", error);
        }
        return forms.value;
    };

    const resolveForm = (hash?: string | null): FormStory | undefined => {
        const key = normalizeHash(hash);
        if (!key) return undefined;
        return forms.value[key] || undefined;
    };

    const formStory = computed<FormStory | undefined>(() =>
        activeKey.value ? forms.value[activeKey.value] : undefined
    );
    const isOpen = computed(() => !!formStory.value);

    const open = (hash: string): boolean => {
        const form = resolveForm(hash);
        if (!form) return false;
        activeKey.value = form.slug;
        modalOpen.value = true;
        return true;
    };

    const close = (): void => {
        activeKey.value = null;
        modalOpen.value = false;
    };

    // Intercetta in modo delegato ogni link ad hash: CTA e <a href="#..."> del rich text.
    const onDocumentClick = (e: MouseEvent): void => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        const anchor = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
        if (!anchor) return;

        const raw = anchor.getAttribute('href') ?? '';
        let hash = '';
        if (raw[0] === '#') hash = raw;
        else if (raw.startsWith('/#')) hash = raw.slice(1);
        else if (anchor.hash && anchor.pathname === window.location.pathname) hash = anchor.hash;
        if (!hash) return;

        if (resolveForm(hash)) {
            e.preventDefault();
            open(hash);
        }
    };

    const install = (): void => {
        if (clickListenerInstalled || !import.meta.client) return;
        clickListenerInstalled = true;
        void loadForms();
    };

    return {
        modalOpen,
        isOpen,
        formStory,
        forms,
        loadForms,
        resolveForm,
        open,
        close,
        install
    };
};
