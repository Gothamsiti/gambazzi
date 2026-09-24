<template lang="pug">
a.MainCTA(:class="{scrolled: _scrolled && !targetInView && !productColorsInView}" :href="$__url(targetID)" @click="toDown")
    p.h4 {{ $__('mainCTALabel') }}
</template>
<script setup>
    const { $__ } = useNuxtApp();
    const { sizes, scroll } = useSizes();
    const _scrolled = computed(() => scroll.value.top > sizes.value.height/4);
    const targetID = computed(() => `#${$__('mainCTATargetID')}`);
    const targetInView = ref(false);
    let observer = null;
    let retryId = null;
    const RETRY_TIMEOUT = 5000;
    const checkTargetIsInView = (deadline = performance.now() + RETRY_TIMEOUT) => {
        const target = $__('mainCTATargetID');
        if(!target || target === 'mainCTATargetID') return;

        const targetEl = document.querySelector(targetID.value);
        if(!targetEl){
            if(performance.now() >= deadline) return;
            retryId = requestAnimationFrame(() => checkTargetIsInView(deadline));
        }
        else{
            observer = new IntersectionObserver((entries) => entries.forEach(entry => targetInView.value = entry.isIntersecting), { threshold:0.1 });
            observer.observe(targetEl);
        }
    };
    const productColorsInView = ref(false);
    let productColorsEl = null;
    const updateProductColorsInView = () => {
        if(!productColorsEl) productColorsEl = document.querySelector('.BodyProductColors');
        if(!productColorsEl) return;
        const rect = productColorsEl.getBoundingClientRect();
        const entered = sizes.value.height - rect.top;
        productColorsInView.value = rect.bottom > sizes.value.height && entered >= rect.height * 0.1;
    };

    watch([scroll, sizes], updateProductColorsInView, { deep: true });

    const toDown = (event) => {
        event.preventDefault();
        const targetEl = document.querySelector(targetID.value);
        if(targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
    };

    onMounted(() => {
        nextTick(() => {
            checkTargetIsInView();
        });
    });
    onUnmounted(() => {
        if(observer) observer.disconnect();
        if(retryId) cancelAnimationFrame(retryId);
    });
</script>
<style lang="scss">
.MainCTA{
    position: fixed;
    bottom: mw(1);
    left: 50%;
    transform: translateX(-50%) translateY(3rem);
    z-index: 3 !important;
    opacity: 0;
    transition: opacity $dt*.5 $de $dt*.5, transform $dt*1.5 $de;
    background-color: rgba($black, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 2rem;
    padding: 1.3rem 4rem;
    color: $white;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba($white, 0.1);
    @include media(500){
        bottom: mw(4);
    }
    &.scrolled{
        transform: translateX(-50%) translateY(0);
        opacity: 1;
        transition: opacity $dt*.5 $de, transform $dt*1.5 $de;
    }
}
</style>