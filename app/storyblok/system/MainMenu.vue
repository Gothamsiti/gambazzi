<template lang="pug">
#MainMenu(v-if="menu" ref="$el" :class="{open: menuOpen}" :aria-hidden="!menuOpen" :inert="!menuOpen")
    nav.items(:aria-label="label('mainNavigation', 'Navigazione principale')")
        .left
            StoryblokComponent(v-for="item of menu.itemsLeft" :blok="item" :key="item._uid" v-editable="item")
        .right
            StoryblokComponent(v-for="item of menu.itemsRight" :blok="item" :key="item._uid" v-editable="item")
</template>
<script setup>
    const { menuOpen } = useAppLayout();
    const { sbEditor } = useStoryblokEditor();
    const route = useRoute();
    const { story } = await useAsyncGothamStoryblok('system/mainmenu', { isEditor: sbEditor.value });
    const menu = computed(() => story.value?.content || null);

    const editingMenu = computed(() => sbEditor.value && /(^|\/)system\/mainmenu\/?$/.test(route.path));
    if (editingMenu.value) menuOpen.value = true;
    watch(() => route.fullPath, () => menuOpen.value = editingMenu.value);
    const { $__ } = useNuxtApp();
    // finché le label non sono su Storyblok $__ restituisce la chiave: in quel caso si usa il fallback
    const label = (key, fallback) => { const s = $__(key); return s && s !== key ? s : fallback; };

    // all'apertura il focus va sulla prima voce, così la navigazione da tastiera parte dal menu
    const $el = ref();
    watch(menuOpen, (open) => {
        if (!open || editingMenu.value) return;
        nextTick(() => $el.value?.querySelector('a[href], button')?.focus({ preventScroll: true }));
    });
    const onKeydown = (e) => {
        if (e.key !== 'Escape' || !menuOpen.value) return;
        menuOpen.value = false;
        // chiuso da tastiera, il focus torna al bottone che lo apre
        document.querySelector('#mainHeader button.menu')?.focus();
    };
    onMounted(() => window.addEventListener('keydown', onKeydown));
    onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>
<style lang="scss">
#MainMenu{
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: mw(4) mw(2) mw(2);
    box-sizing: border-box;
    background: $black;
    color: $white;
    z-index: 3 !important;
    overflow-y: auto;
    overscroll-behavior: contain;
    opacity: 0;
    pointer-events: none;
    transition: opacity $dt $de;
    &.open{
        opacity: 1;
        pointer-events: all;
    }
    .items{
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: mw(4);
        .left, .right{
            display: flex;
            flex-direction: column;
        }
        .left{
            align-items: flex-start;
        }
        .right{
            align-items: flex-end;
            text-align: right;
            gap: 1.6rem;
        }
    }
    .BodyCTA{
        display: inline-flex;
        flex-direction: row;
        width: auto;
        min-height: 0;
        padding: 0;
        gap: 0;
        background: none;
        color: $white !important;
        border-radius: 0;
        transition: opacity $dt $de;
        .icon{
            display: none;
        }
        .label{
            text-transform: none;
            // underline disegnato come background per poterne animare la larghezza
            background: linear-gradient(currentColor, currentColor) no-repeat 0 100% / 0 .04em;
            transition: background-size $dt $de;
        }
        &:hover .label, &.router-link-active .label{
            background-size: 100% .04em;
        }
    }
    .left .BodyCTA .label{
        font-size: 5.8rem;
        font-weight: 700;
        line-height: 1.28em;
    }
    .right .BodyCTA{
        .label{
            font-size: 2.4rem;
            font-weight: 300;
            background-position: 100% 100%;
        }
        // la prima voce di destra è il titolo della sezione
        &:first-child{
            margin-bottom: .8rem;
            .label{
                font-size: 5.8rem;
                font-weight: 700;
            }
        }
    }
    @include media(768){
        .items{
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-end;
            .right{
                align-items: flex-start;
                text-align: left;
            }
        }
        .left .BodyCTA .label,
        .right .BodyCTA:first-child .label{
            font-size: 4rem;
        }
        .right .BodyCTA .label{
            font-size: 1.8rem;
            background-position: 0 100%;
        }
    }
}
</style>
