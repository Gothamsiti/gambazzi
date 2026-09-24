<template lang="pug">
.BodyFaqList
    StoryblokComponent(v-for="faq in blok.faqs" :key="faq._uid" :blok="faq")
</template>
<script setup>
    const {blok} = defineProps(["blok"]);
</script>
<style lang="scss">
.BodyFaqList{
    display: flex;
    flex-direction: column;
    gap: mw(2);
}
</style>