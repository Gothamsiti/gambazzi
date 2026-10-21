<template lang="pug">
.BodyForm(:class="mw.classes" :style="mw.style")
	FormMain(:id="`form-${formName}`" :blok="{form: formUuid, scope: blok.scope}" :submitting="submitting" :submitted="submitted" :error="error" @submit="submit")
</template>
<script setup>
	const {blok} = defineProps(["blok"]);
	// blok può essere la story del form (modale) o un blok BodyForm inserito in pagina (campo form = uuid della story)
	const formUuid = computed(() => blok.form || blok.uuid);
	const formName = computed(() => blok.name || blok.scope);
	const mw = useMwClass(() => blok.class);

	const submitting = ref(false);
	const submitted = ref(false);
	const error = ref(undefined)
	const submit = async (e) => {

		window.dataLayer?.push({
			event: 'form_submit_attempt',
			form_name: `form-${formName.value}`,
		})
		error.value = false;
		const { fields, emailTemplate } = e;
		fields.formData.append('emailTemplate',emailTemplate)

		try {
			submitting.value = true
			await $fetch('/api/gothamform/brevo', {
				method: 'POST',
				body: fields.formData,
			})
			fields.clearFields()
			submitted.value = true;
			window.dataLayer?.push({
				event: 'form_submit_success',
				form_name: `form-${formName.value}`,
			})
		}
		catch (fetchError) {
			console.log('formSubmit fetchError', fetchError)
			submitting.value = false;
			error.value = fetchError
			window.dataLayer?.push({
				event: 'form_submit_error',
				form_name: `form-${formName.value}`,
			})
		}
		
	}
</script>
<style lang="scss">
.BodyForm{
	box-sizing: border-box;
	max-width: 100%;
}
.Form{
	// tutti i colori derivano da currentColor: funziona sia sul fondo scuro della pagina che nella modale bianca
	--form-line: color-mix(in srgb, currentColor 50%, transparent);
	--form-muted: color-mix(in srgb, currentColor 60%, transparent);
	--form-error: #d82626;
	.system.message{
		padding: mw(2);
		display: flex;
		flex-direction: column;
		gap: mw(1);
		border: 1px solid var(--form-line);
		border-radius: $dbr;
		&.error{
			background-color: rgb(109, 10, 10);
			border-color: transparent;
			color: $white !important;
		}
	}
	form{
		display: flex;
		flex-direction: column;
		gap: mw(2.5);
		@include media(550){
			gap: mw(6);
		}
		*{
			color: inherit !important;
		}
		input[type="text"],
		input[type="email"],
		input[type="tel"],
		.dp__input,
		textarea,
		select{
			appearance: none;
			width: 100%;
			box-sizing: border-box;
			margin: 0;
			padding: 1rem 0;
			border: none;
			border-bottom: 1px solid var(--form-line);
			border-radius: 0;
			background: transparent;
			font-family: inherit;
			font-size: 2.2rem;
			font-weight: 300;
			outline: none;
			transition: border-color $dt $de;
			@include media(550){
				font-size: 1.8rem;
			}
			&::placeholder{
				color: var(--form-muted);
				opacity: 1;
			}
			&:focus{
				border-color: currentColor;
			}
		}
		textarea{
			display: block;
			min-height: 18rem;
			padding: 1rem;
			border: 1px solid var(--form-line);
			border-radius: .4rem;
			font-size: 1.6rem;
			resize: vertical;
		}
		.input{
			position: relative;
			.iconify:has(+input){
				position: absolute;
				top: 50%;
				left: 1.5rem;
				transform: translateY(-50%);
			}
			.iconify:has(+textarea){
				position: absolute;
				left: 1.5rem;
				top: 1rem;
			}
		}
		// label piccola maiuscola: sotto la linea per gli input (visibile solo a campo compilato), sopra per la textarea
		.fieldText,
		.fieldEmail,
		.fieldTextArea{
			display: flex;
			flex-direction: column;
			gap: .8rem;
			> label{
				font-size: 1.2rem;
				text-transform: uppercase;
			}
		}
		.fieldText,
		.fieldEmail{
			> label{
				order: 1;
				opacity: 0;
				transition: opacity $dt $de;
			}
			&:has(input:not(:placeholder-shown)) > label{
				opacity: 1;
			}
			&:has(input:not(:placeholder-shown)) input{
				border-color: currentColor;
			}
		}
		.fieldTextArea > label{
			color: var(--form-muted) !important;
		}
		// con la label sopra, il placeholder vuoto mostrerebbe solo l'asterisco del required
		.fieldTextArea:has(> label) textarea::placeholder{
			color: transparent;
		}
		.dp__input_wrap{
			svg{
				display: none;
			}
		}
		.fieldFile{
			display: flex;
			flex-direction: column;
			gap: 1rem;
			input[type="file"]{
				display: none;
			}
			.files{
				display: inline-block;
				padding: 1rem 2rem;
				border: 1px solid var(--form-line);
				border-radius: .4rem;
				cursor: pointer;
				.file{
					display: flex;
					align-items: center;
					justify-content: space-between;
				}
			}
		}
		.fieldSelect{
			display: flex;
			flex-direction: column;
			gap: 1rem;
			label{
				font-size: 1.2rem;
				text-transform: uppercase;
				color: var(--form-muted) !important;
			}
			select{
				option{
					color: $black !important;
				}
				&:not(.compiled){
					color: var(--form-muted) !important;
				}
			}
			.iconify{
				display: none;
			}
		}
		.fieldCheckbox{
			display: flex;
			flex-direction: column;
			gap: 1rem;
			// le checkbox consecutive stanno più vicine tra loro
			& + .fieldCheckbox{
				margin-top: mw(-1.5);
				@include media(550){
					margin-top: mw(-3);
				}
			}
			.inputContent{
				display: flex;
				align-items: flex-start;
				flex-direction: row-reverse;
				justify-content: flex-end;
				gap: .8rem;
				font-size: 1.4rem;
				line-height: 1.3;
				label{
					cursor: pointer;
					*{
						margin: 0;
						font-size: inherit;
						line-height: inherit;
					}
				}
				input[type="checkbox"]{
					appearance: none;
					width: 1.4rem;
					height: 1.4rem;
					flex: 0 0 auto;
					margin: .1rem 0 0;
					border: 1px solid currentColor;
					border-radius: .2rem;
					position: relative;
					cursor: pointer;
					&::after{
						content: '';
						position: absolute;
						top: 50%;
						left: 50%;
						width: .6rem;
						height: .6rem;
						border-radius: .1rem;
						background: transparent;
						transform: translate(-50%, -50%);
						transition: background-color .2s ease-in-out;
					}
					&:checked::after{
						background: currentColor;
					}
				}
			}
			&.error .inputContent{
				color: var(--form-error) !important;
			}
		}
		.error{
			> label{
				color: var(--form-error) !important;
				opacity: 1 !important;
			}
			input, textarea{
				border-color: var(--form-error) !important;
			}
			input::placeholder{
				color: var(--form-error);
			}
		}
		button{
			border: none;
			font-family: inherit;
			cursor: pointer;
		}
		// bottone outline con freccia diagonale (sovrascrive lo stile box di .BodyCTA)
		.submit{
			align-self: flex-end;
			display: inline-flex;
			flex-direction: row;
			align-items: center;
			justify-content: center;
			gap: 1.2rem;
			width: auto;
			min-height: 0;
			margin-top: mw(2);
			padding: 1.6rem 3rem;
			box-sizing: border-box;
			background: transparent;
			color: inherit !important;
			border: 1px solid currentColor;
			border-radius: 1.6rem;
			font-size: 1.4rem;
			font-weight: 500;
			text-transform: uppercase;
			transition: background-color $dt $de, color $dt $de;
			.label{
				font-size: inherit;
			}
			&::after{
				content: '';
				width: 1.6rem;
				height: 1.6rem;
				background-color: currentColor;
				mask: url('~/assets/icons/arrow-right.svg') center / contain no-repeat;
				transform: rotate(-45deg);
			}
			@include media(550){
				align-self: flex-start;
			}
		}
	}
	&.submitting .submit{
		opacity: .5;
		pointer-events: none;
	}
	.fieldFlexGroup{
		display: flex;
		flex-wrap: wrap;
		gap: mw(2.5) mw(4);
		@include media(550){
			gap: mw(6);
		}
		>*{
			flex: 1 1 calc(50% - mw(2));
			@include media(550){
				flex-basis: 100%;
			}
			&.cap{
				flex: 0 0 20rem;
			}
			&.state{
				flex: 0 0 10rem;
			}
		}
	}
	.message{
		> * {
			opacity: 1 !important;
		}
	}
}
</style>
