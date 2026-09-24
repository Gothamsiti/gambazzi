<template lang="pug">
#modal(@click="onBackdropClick")
    .content(ref="content")
        template(v-if="modalOpen")
            h2(v-if="!formStory" v-html="$__('loading')")
            BodyForm(v-else :blok="formStory")
    .close(@click="close")
</template>
<script setup>

const { modalOpen, formStory, install, close } = useModalForms();

const content = ref(null);

install();

const onBackdropClick = (e) => {
    if (!content.value?.contains(e.target)) close();
}

</script>
<style lang="scss">
#modal{
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    z-index: 10 !important;
    background: rgba($black,.8);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    .close{
        @include modalClose;
    }
    .content{
        background: $white;
        padding: mw(1);
        box-sizing: border-box;
        color: $black;
        max-width: mw(40);
        max-height: 90vh;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-width: thin;
        scrollbar-color: rgba($black, .3) transparent;
        @media (max-width: 600px){
            max-width: calc( 100vw - mw(8) );
            max-height: calc( 100dvh - mw(8) );
            padding: mw(8) mw(2);
        }
        &::-webkit-scrollbar{
            width: 6px;
        }
        &::-webkit-scrollbar-track{
            background: transparent;
        }
        &::-webkit-scrollbar-thumb{
            background: rgba($black, .3);
            border-radius: 9rem;
        }
    }
    .modalOpen &{
        opacity: 1;
        pointer-events: all;
    }
}
</style>