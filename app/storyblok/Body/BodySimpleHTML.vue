<template lang="pug">
	div(v-html="blok.HTML")
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
</script>