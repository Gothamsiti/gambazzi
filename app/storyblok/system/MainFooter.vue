<template lang="pug">
#MainFooter()
	StoryblokComponent(v-if="_footer.body?.length" v-for="item of _footer.body" :blok="item" :key="item._uid")
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
	const { sbEditor } = useStoryblokEditor();
	const { story: {value : { content : _footer } } } = await useAsyncGothamStoryblok('system/mainfooter',{ isEditor: sbEditor.value });
</script>
<style lang="scss">
#MainFooter{
    position: relative;
	display: flex;
	flex-direction: column;
	width:100%;
	>*{
		>*{
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			width:100%;
			>*{
				&:first-child{
					padding:mw(2);
					aspect-ratio: 1 / 1;
					background: $blue;
					color: $white;
					svg{
						*{
							fill: currentColor;
						}
					}
				}
				&:nth-child(2){
					.BodyCols{
						flex-direction: column;
						padding:mw(2) mw(3);
						aspect-ratio: 1 / 1;
						align-self: stretch;
						justify-content: space-between;
						font-weight: bold;
					}
				}
				&:nth-child(3){
					padding:mw(2);
					aspect-ratio: 1 / 1;
					display: flex;
					flex-direction: column;
					align-items: flex-start;
					justify-content: flex-end;
					background: $white;
				}
				&:nth-child(4){
					padding:mw(2);
					aspect-ratio: 1 / 1;
				}
			}
		}
	}
}
</style>