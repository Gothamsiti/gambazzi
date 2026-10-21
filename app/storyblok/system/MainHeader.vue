<template lang="pug">
header#mainHeader(ref="$header" :class="{hide: scroll.direction>0 && scrolled && !menuOpen, light: light || menuOpen, menuOpen}")
    NuxtLink.logo(:to="$__url('/')")
        span(v-html="logo")
    nav.actions
        NuxtLink.contacts(:to="$__url('pages/contattaci')") 
            span(v-html="$__('contacts')")
        button.menu(type="button" @click="menuOpen = !menuOpen" :aria-label="menuOpen ? 'Chiudi menu' : 'Apri menu'" :aria-expanded="menuOpen")
            span.burger
                span
                span
                span
            span.label {{ menuOpen ? $__('close') : $__('menu') }}
</template>
<script setup>
    import logo from '~/assets/logo.svg?raw';
    const { sizes, scroll } = useSizes();
    const { menuOpen } = useAppLayout();
    const route = useRoute();
    const $header = ref();
    const light = ref(false);
    // si nasconde appena l'utente ha superato l'altezza dell'header scorrendo verso il basso
    const scrolled = computed(() => scroll.value.top > ($header.value?.offsetHeight || 0));

    // colore di sfondo effettivo di un elemento: null se trasparente
    const parseBackground = (el) => {
        const match = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
        if (!match) return null;
        const [r, g, b, a = 1] = match.map(Number);
        return a < .5 ? null : { r, g, b };
    };
    const isDark = ({ r, g, b }) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < .5;

    // a decidere è il BodyCols di primo livello della Page che si trova sotto l'header (a metà della sua altezza)
    const updateTheme = () => {
        const header = $header.value;
        if (!header) return;
        const y = header.getBoundingClientRect().height / 2;
        const section = [...document.querySelectorAll('.Page > .BodyColsWrap > .BodyCols')].find(el => {
            const { top, bottom } = el.getBoundingClientRect();
            return top <= y && bottom > y;
        });
        const bkg = section && parseBackground(section);
        light.value = bkg ? isDark(bkg) : false;
    };

    watch(() => [scroll.value.top, sizes.value.width, sizes.value.height], updateTheme);
    watch(() => route.fullPath, () => nextTick(updateTheme));
    onMounted(() => nextTick(updateTheme));
</script>
<style lang="scss">
header#mainHeader{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: mw(1) mw(2);
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    box-sizing: border-box;
    z-index: 4 !important;
    color: $black;
    transition: opacity $dt $de, color $dt $de;
    .logo{
        display: flex;
        color: $blue;
        transition: color $dt $de;
        span{
            display: flex;
        }
        svg{
            width: mw(8);
            height: auto;
            path{
                fill: currentColor;
            }
        }
    }
    .actions{
        display: flex;
        align-items: center;
        gap: mw(2);
        font-size: 1.2rem;
        font-weight: 700;
        text-transform: uppercase;
        white-space: nowrap;
    }
    .menu{
        display: flex;
        align-items: center;
        gap: .8em;
        padding: 0;
        border: 0;
        background: none;
        color: inherit;
        font: inherit;
        text-transform: inherit;
        cursor: pointer;
        .burger{
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 1em;
            height: .8em;
            span{
                display: block;
                height: 1px;
                background: currentColor;
                transition: transform $dt $de, opacity $dt $de;
            }
        }
    }
    &.menuOpen .menu .burger{
        span:nth-child(1){
            transform: translateY(calc(.4em - .5px)) rotate(45deg);
        }
        span:nth-child(2){
            opacity: 0;
        }
        span:nth-child(3){
            transform: translateY(calc(-.4em + .5px)) rotate(-45deg);
        }
    }
    &.light{
        color: $white;
        .logo{
            color: $white;
        }
    }
    &.hide{
        // opacity: 0 !important;
        // pointer-events: none;
    }
}
</style>
