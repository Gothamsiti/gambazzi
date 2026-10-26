<template lang="pug">
//- sempre nel DOM come primo elemento focusabile: il primo Tab lo raggiunge sempre, anche partendo dalla barra degli indirizzi
.AccessibilitySkip(ref="box" :class="{visible}" tabindex="0" role="button" aria-live="polite" @focus="onFocus" @blur="hide" @keydown="onKeydown" @click="activate")
    | {{ message }}
</template>
<script setup>
const { $__ } = useNuxtApp();
// finché le label non sono su Storyblok $__ restituisce la chiave: in quel caso si usa il fallback
const label = (key, fallback) => { const s = $__(key); return s && s !== key ? s : fallback; };

const visible = ref(false)
const step = ref(0)
const box = ref(null)

const targets = [
    { selector: '#main', message: label('goToMain', 'Vai al contenuto principale') },
    { selector: '#mainHeader', message: label('goToHeader', "Vai all'intestazione") },
    { selector: '#MainFooter', message: label('goToFooter', 'Vai al piè di pagina') },
]

const message = computed(() => targets[step.value]?.message)

function focusTarget(selector) {
  const el = document.querySelector(selector)
  if (!el) return
  // tabindex solo per il tempo del focus: lasciato lì, ogni click nella sezione la renderebbe l'elemento attivo
  if (!el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '-1')
    el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true })
  }
  el.focus({ preventScroll: true })
  el.scrollIntoView();
}

function activate() {
  focusTarget(targets[step.value].selector)
}

// si mostra solo con il focus da tastiera: chi usa il mouse non lo vede mai
function onFocus() {
  step.value = 0
  visible.value = box.value?.matches(':focus-visible') ?? true
}

function hide() {
  visible.value = false
  step.value = 0
}

// Tab scorre le destinazioni; oltre l'ultima (o prima della prima con Shift) il focus prosegue normalmente
function onKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    activate()
  } else if (e.key === 'Tab') {
    const next = step.value + (e.shiftKey ? -1 : 1)
    if (next < 0 || next > targets.length - 1) return
    e.preventDefault()
    step.value = next
    visible.value = true
  } else if (e.key === 'Escape') {
    box.value?.blur()
  }
}

// a ogni cambio pagina chi naviga da tastiera riparte dallo skip, come al primo caricamento
let keyboardUser = false
const onKey = (e) => {
  if (e.key !== 'Tab') return
  keyboardUser = true
  // nessun elemento attivo (es. dopo un click su testo o sfondo): il Tab riparte dallo skip invece che dal punto cliccato
  const active = document.activeElement
  if (!e.shiftKey && (!active || active === document.body)) {
    e.preventDefault()
    box.value?.focus()
  }
}
const onPointer = () => { keyboardUser = false }
const route = useRoute();
watch(() => route.path, () => {
  if (keyboardUser) nextTick(() => box.value?.focus({ preventScroll: true }))
})

onMounted(() => {
  window.addEventListener('keydown', onKey, true)
  window.addEventListener('pointerdown', onPointer, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey, true)
  window.removeEventListener('pointerdown', onPointer, true)
})
</script>

<style lang="scss">
.AccessibilitySkip {
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 9999 !important;
    background: $white;
    color: $black;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
    outline: 3px solid $blue;
    box-shadow: 0 8px 20px rgba(0,0,0,.35);
    cursor: pointer;
    // nascosto ma raggiungibile: display/visibility lo toglierebbero dall'ordine di tabulazione
    &:not(.visible){
        clip-path: inset(50%);
        width: 1px;
        height: 1px;
        padding: 0;
        overflow: hidden;
        white-space: nowrap;
        outline: none;
        box-shadow: none;
    }
    &:focus {
        outline: 3px solid $blue;
    }
}
</style>
