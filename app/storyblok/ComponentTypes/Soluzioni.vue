<template lang="pug">
//- stesso body di page: i campi card servono solo a BodyStoriesList
Page.Soluzioni(:blok="blok")
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
</script>
