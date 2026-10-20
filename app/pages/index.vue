<template lang="pug">
.index
    StoryblokComponent(v-if="story?.content?.component" :blok="story.content" :first_published_at="story.first_published_at" :created_at="story.created_at")
</template>
<script setup>
    const { $__parseEndpoint } = useNuxtApp();
    let { endpoint } = $__parseEndpoint();
    if(!endpoint) throw createError({ statusCode: 404, statusMessage: 'Endpoint not found', fatal: true });
    const { sbEditor } = useStoryblokEditor();
    const params = { isEditor: sbEditor.value, isMainStory: true };
    const { story, rels } = await useAsyncGothamStoryblok(endpoint,params);
    useSeo(story);
    onMounted(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant',
        });
    })
</script>
<style lang="scss">
.index{
    position: relative;
    transition: filter $dt $de;
    z-index: 1;
    min-height: 50vh;
    min-height: 50dvh;
    .menuOpen > &{
        pointer-events: none;
    }
}
body:has(.menuOpen){
    overflow: hidden;
}
</style>
