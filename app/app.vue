<template lang="pug">
  main#app(:class="{sbEditor,modalOpen,menuOpen}" :style="{ backgroundColor : 'white'}")
    NuxtRouteAnnouncer
    StoryblokComponent(:blok="{component:'MainHeader'}")
    StoryblokComponent(:blok="{component:'MainMenu'}")
    NuxtPage
    StoryblokComponent(:blok="{component:'MainModalForms'}")
    StoryblokComponent(:blok="{component:'MainFooter'}")
</template>
<script setup>
    const { sbEditor } = useStoryblokEditor();
    const { modalOpen, menuOpen } = useAppLayout();
    useGoogleTagManager();
    onMounted(() => {
        reloadIfChromeIosBarsOverlay();
    });
    function reloadIfChromeIosBarsOverlay() {
        if (!/CriOS\//.test(navigator.userAgent)) return;
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav?.type !== 'navigate') return;
        if (window.innerHeight <= document.documentElement.clientHeight + 1) return;
        location.reload();
    }
</script>
<style lang="scss">
  #app{
    position: relative;
    background-color: $bkg !important;
    z-index: 1;
    >*{
      z-index: 2;
    }
    &.sbEditor{
      background-size: mw(1) mw(1), mw(5) mw(5), mw(10) mw(10);
      background-image:
        linear-gradient(to right, #00ff1110 1px, transparent 1px),
        linear-gradient(to bottom, #00ff1115 1px, transparent 1px),
        linear-gradient(to right, #00ff1120 2px, transparent 2px),
        linear-gradient(to bottom, #00ff1110 1px, transparent 1px),
        linear-gradient(to right, #00ff1115 1px, transparent 1px),
        linear-gradient(to bottom, #00ff1120 2px, transparent 2px);
    }
  }
</style>



