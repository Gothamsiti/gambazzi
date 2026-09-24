<template lang="pug">
.BodyAnnunciList
    StoryblokComponent( v-for="annuncio in annunci" :blok="annuncio" :key="annuncio._uid" :class="blok.class")
</template>
<script setup>
    const {blok} = defineProps(["blok"]);
    defineEmits(['proceed']);

    const options = {starts_with: 'annunci/'};
    if(blok.category){
        options['filter_query[category][in]'] = blok.category;
    }

    const { stories } = await useAsyncGothamStoryblok(
        undefined,
        options
    )
    const annunci = computed(() => stories?.value?.map(story => {return {...story,component:'BodyAnnunciListItem'}}));
</script>
<style lang="scss">
.BodyAnnunciList{
    display: contents;
}
</style>