<template lang="pug">
.BodyForm(:class="blok.class")
	FormMain(:id="`form-${blok.name}`" :blok="{form: blok.uuid}" :submitting="submitting" :submitted="submitted" :error="error" @submit="submit")
</template>
<script setup>
	const {blok} = defineProps(["blok"]);

	const submitting = ref(false);
	const submitted = ref(false);
	const error = ref(undefined)
	const submit = async (e) => {

		window.dataLayer?.push({
			event: 'form_submit_attempt',
			form_name: `form-${blok.name}`,
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
				form_name: `form-${blok.name}`,
			})
		}
		catch (fetchError) {
			console.log('formSubmit fetchError', fetchError)
			submitting.value = false;
			error.value = fetchError
			window.dataLayer?.push({
				event: 'form_submit_error',
				form_name: `form-${blok.name}`,
			})
		}
		
	}
</script>
<style lang="scss">
.Form{
	.system.message{
		padding: mw(2);
		background-color: $bkg;
		display: flex;
		flex-direction: column;
		border-radius: $dbr;
		&.error{
			background-color: rgb(109, 10, 10);
			color: $white !important;
		}
	}
	form{
		display: flex;
		flex-direction: column;
		gap: 2rem;
		input[type="text"],
		input[type="email"],
		input[type="tel"],
		.dp__input,
		textarea,
		select{
			appearance: none;
			border-radius: .5rem;
			border: none;
			padding: 8px;
			width: 100%;
			box-sizing: border-box;
			background-color: $bkg;
			min-height: 5rem;
			font-family: inherit;
			font-size: inherit;
			@include media(500){
				min-height: 4rem;
				font-size: 1.6rem;
			}
			&::placeholder{
				color: $white;
			}
		}
		textarea{
			min-height: 20rem;
			padding-top: 1rem;
			@media screen and (min-height:400px) {
				min-height: 10rem;
			}
		};
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
				border: 1px solid $bkg;
				border-radius: 4px;
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
			gap:1rem;
			label{
				font-size: 1.2rem;
				color: rgba($white,.3) !important;
			}
			select{
				padding-left: 2rem;
				option[default]{
					opacity: .5;
				}
				&:not(.compiled){
					color: rgba($white,.3) !important;
				}
			}
			.iconify{
				display: none;
			}
		}
		button{
			border: none;
			font-size: inherit;
			font-weight: inherit;
			font-family: inherit;
			height: 5rem;
			padding: auto;
			align-self: center;
		}
		.submit{
			align-self: flex-end;
			background-color: $black;
			color: $white !important;
			padding: 0 3rem;
			box-sizing: border-box;
			border-radius: calc($dbr*.5);
			cursor: pointer;
			@include media(550){
				align-self: flex-start;
			}
		}
		*{
			color: inherit !important;
		}
		.fieldCheckbox{
			display: flex;
			flex-direction: column;
			gap: 1rem;
			.inputContent{
				display: flex;
				align-items: center;
				flex-direction: row-reverse;
				justify-content: flex-end;
				gap: .5rem;
				label{
					*{
						margin: 0;
					}
				}
				input[type="checkbox"]{
					appearance: none;
					width: 16px;
					height: 16px;
					flex: 0 0 auto;
					border: 1px solid $bkg;
					border-radius: 4px;
					position: relative;
					align-self: flex-start;
					cursor: pointer;
					&::after{
						content: '';
						position: absolute;
						top: 40%;
						left: 50%;
						width: 5px;
						height: 10px;
						border-right: 2px solid transparent;
						border-bottom: 2px solid transparent;
						transform: translate(-50%, -50%) rotate(45deg);
						transition: border-color .2s ease-in-out;
					}
					&:checked::after{
						border-color: $black;
					}
				}
				label{
					font-size: inherit;
				}
			}
		}

		.error{
			> label{
				color: #d82626 !important;
			}
			input, textarea{
				border-color: #d82626 !important;
			}
		}
		
	}
	.fieldFlexGroup{
		display: flex;
		flex-wrap: wrap;
		gap: 2rem;
		@include media(500){
			gap: 1rem;
		}
		>*{
			flex: 1 1 calc(50% - 1rem);
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