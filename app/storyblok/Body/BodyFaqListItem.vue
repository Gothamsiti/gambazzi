<template lang="pug">
.BodyFaqListItem
    .h1 {{ blok.number }}
    .h2 {{ blok.title }}
    .p
        StoryblokRichText(:document="blok.text" :components="richTextComponents")
</template>
<script setup>
    import RichTextImage from '~/storyblok/system/RichTextImage.vue';
    const {blok} = defineProps(["blok"]);
    const richTextComponents = {image: RichTextImage};
    provideRichTextImageConfig(() => ({document: blok.text, sizes: '(max-width: 500px) 100vw, 50vw'}));
</script>
<style lang="scss">
.BodyFaqListItem{
    display: flex;
    gap: mw(1);
    padding: mw(2) 0;
    border-top:1px solid $bkg;
    &:is(:last-child){
        padding-bottom:mw(4);
        border-bottom:1px solid $bkg;
    }
    @include media(500){
        // numero e titolo sulla prima riga, testo sulla riga successiva a tutta larghezza
        display: grid;
        grid-template-columns: 8rem auto;
        justify-content: start;
        align-items: start;
        .p{
            grid-column: 1 / -1;
        }
    }
    .h1{
        flex: 0 0 mw(14);
    }
    .h2{
        flex:0 0 mw(25);
    }
    .p{
        padding-top:1rem;
    }
}
</style>