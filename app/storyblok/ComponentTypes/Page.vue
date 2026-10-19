<template lang="pug">
.Page(:class="mw.classes" :style="mw.style")
    StoryblokComponent(v-for="item of blok.body" :key="item._uid" :blok="item" v-editable="item")
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
	const mw = useMwClass(() => blok.class);
</script>
<style lang="scss">
.Page{
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
    z-index: 1;
}
</style>
