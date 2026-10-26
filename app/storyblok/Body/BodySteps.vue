<template lang="pug">
section.BodySteps(v-if="steps.length" :id="blok.id || undefined" :class="mw.classes" :style="bgStyle")
	.label(v-if="blok.label") {{ blok.label }}
	.arrows(v-if="steps.length > 1")
		button.arrow.arrow--up(type="button" :class="{ 'is-disabled': current === 0 }" :aria-disabled="current === 0" @click="go(-1)" :aria-label="label('previousStep', 'Step precedente')" :aria-controls="stepsId")
			Icon(:name="'gotham:arrow-right'" aria-hidden="true")
		button.arrow.arrow--down(type="button" :class="{ 'is-disabled': current === steps.length - 1 }" :aria-disabled="current === steps.length - 1" @click="go(1)" :aria-label="label('nextStep', 'Step successivo')" :aria-controls="stepsId")
			Icon(:name="'gotham:arrow-right'" aria-hidden="true")
	.numbers(aria-hidden="true")
		.h1.number(v-for="(step, i) in steps" :key="`number-${step._uid}`" :class="{ active: i === current }") {{ formatNumber(i) }}
	.steps(:id="stepsId" aria-live="polite")
		.step(v-for="(step, i) in steps" :key="step._uid" :class="{ active: i === current }" :aria-hidden="i !== current" :inert="i !== current" role="group" :aria-label="`${i + 1} / ${steps.length}`")
			StoryblokComponent(:blok="step" v-editable="step")
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
	const mw = useMwClass(() => blok.class);
	const steps = computed(() => blok.steps || []);
	const stepsId = `steps-${blok._uid}`;
	const { $__ } = useNuxtApp();
	// finché le label non sono su Storyblok $__ restituisce la chiave: in quel caso si usa il fallback
	const label = (key, fallback) => { const s = $__(key); return s && s !== key ? s : fallback; };
	const current = ref(0);

	const bgStyle = computed(() => ({
		backgroundColor: blok.backgroundColor,
		color: blok.color,
		...mw.style,
	}));

	const formatNumber = (i) => `${String(i + 1).padStart(2, '0')}.`;
	const go = (dir) => {
		current.value = Math.min(Math.max(current.value + dir, 0), steps.value.length - 1);
	};
	// se nell'editor vengono rimossi step, l'indice corrente non deve uscire dal range
	watch(() => steps.value.length, (length) => {
		if (current.value > length - 1) current.value = Math.max(length - 1, 0);
	});
</script>
<style lang="scss">
@use "sass:color";

.BodySteps{
	// label | frecce | numero | testo
	display: grid;
	grid-template-columns: mw(11.5) mw(6.5) mw(24) 1fr;
	align-items: start;
	width: 100%;
	box-sizing: border-box;
	padding: mw(15) mw(2);
	background-color: $black;
	color: $white;
	.label{
		font-size: 1.6rem;
		text-transform: uppercase;
	}
	.arrows{
		display: flex;
		flex-direction: column;
		gap: mw(.5);
	}
	.arrow{
		cursor: pointer;
		padding: 0;
		border: 0;
		color: inherit;
		font: inherit;
		width: max(mw(4.5), 4.4rem);
		height: max(mw(4.5), 4.4rem);
		background: color.adjust($greyDark, $lightness: 10%);
		border-radius: mw(.25);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color $dt $de, opacity $dt $de;
		&.is-disabled{
			opacity: .3;
			pointer-events: none;
		}
		.iconify{
			font-size: max(mw(2), 2rem);
			color: $white;
		}
		&:hover{
			background: color.adjust($greyDark, $lightness: 20%);
		}
		&--up .iconify{
			transform: rotate(-90deg);
		}
		&--down .iconify{
			transform: rotate(90deg);
		}
	}
	// numeri e step sono sovrapposti nella stessa cella: l'altezza resta quella dello step più lungo
	.numbers,
	.steps{
		display: grid;
		>*{
			grid-area: 1 / 1;
			opacity: 0;
			visibility: hidden;
			transform: translateY(2rem);
			transition: opacity $dt $de, transform $dt $de, visibility 0s linear $dt;
			&.active{
				opacity: 1;
				visibility: visible;
				transform: none;
				transition: opacity $dt $de, transform $dt $de, visibility 0s;
			}
		}
	}
	.number{
		line-height: 1em;
	}
	.steps .BodySimpleText{
		display: flex;
		flex-direction: column;
		gap: mw(1);
	}
	@include media(860){
		grid-template-columns: mw(8) 1fr;
		row-gap: mw(4);
		.label{
			grid-column: 1 / -1;
		}
		.steps{
			grid-column: 1 / -1;
		}
	}
	@include media(550){
		grid-template-columns: mw(15) 1fr;
		row-gap: mw(8);
		padding: mw(25) mw(5);
		.arrows{
			gap: mw(2);
		}
		.steps .BodySimpleText{
			gap: mw(4);
		}
	}
}
</style>
