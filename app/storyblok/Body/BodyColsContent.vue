<template lang="pug">
template(v-for="col of blok.cols" :key="col._uid")
    StoryblokComponent( :blok="col" v-editable="noeditable ? undefined : col" @proceed="emit('proceed')")
    .separator(v-if="blok.customClass.includes('point-separator')")
</template>
<script setup>
    const {blok, noeditable} = defineProps(["blok","noeditable"]);
    const emit = defineEmits(['proceed']);
</script>