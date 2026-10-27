<template lang="pug">
ul.LanguageSelector(v-if="languages?.length > 1" :aria-label="label('selectLanguage', 'Seleziona lingua')")
    li(v-for="lang of languages" :key="lang")
        //- link nativo: lingua e label vengono risolte all'avvio dell'app, serve un caricamento completo
        a(:href="urlFor(lang)" :hreflang="lang" :lang="lang" :aria-label="languageName(lang)" :aria-current="lang === currentLanguage ? 'true' : undefined" :class="{active: lang === currentLanguage}") {{ lang }}
</template>
<script setup>
    const { $__ } = useNuxtApp();
    // finché le label non sono su Storyblok $__ restituisce la chiave: in quel caso si usa il fallback
    const label = (key, fallback) => { const s = $__(key); return s && s !== key ? s : fallback; };
    const { languages, currentLanguage } = useLanguage();
    const route = useRoute();

    // gli slug sono uguali in tutte le lingue: basta sostituire il primo segmento del percorso
    const urlFor = (lang) => {
        const segment = route.path.split('/')[1] || '';
        const rest = languages.value.includes(segment) ? route.fullPath.slice(segment.length + 1) : route.fullPath;
        return `/${lang}${rest.startsWith('/') || !rest ? rest : `/${rest}`}`;
    };
    // nome della lingua scritto nella lingua stessa (es. "English", "italiano")
    const languageName = (lang) => {
        try { return new Intl.DisplayNames([lang], { type: 'language' }).of(lang); }
        catch { return lang; }
    };
</script>
<style lang="scss">
.LanguageSelector{
    display: flex;
    align-items: center;
    gap: .6em;
    margin: 0;
    padding: 0;
    list-style: none;
    li{
        display: flex;
    }
    a{
        color: inherit;
        text-decoration: none;
        opacity: .4;
        transition: opacity $dt $de;
        &:hover, &:focus-visible, &.active{
            opacity: 1;
        }
    }
}
</style>
