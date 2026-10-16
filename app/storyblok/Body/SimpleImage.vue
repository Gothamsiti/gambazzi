<template lang="pug">
ImageItem.SimpleImage(:id="blok.id || undefined" :blok="blok.image" :class="[blok.class, ...mw.classes]" :style="{...mw.style}")
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
	const mw = useMwClass(() => blok.class);
</script>
<style lang="scss">
.SimpleImage{
	overflow:hidden;
	background-color: #f3f3f3;
	&.transparent-background{
		background-color: transparent;
	}

    &.gallery-item{
        flex:0 0 mw(24);
		width: mw(24);
		height: mw(30);
		@include media(980){
            flex:0 0 mw(30);
            width: mw(30);
            height: mw(40);
        }
		@include media(550){
            flex:0 0 mw(40);
            width: mw(40);
            height: mw(50);
        }
    }
}
</style>