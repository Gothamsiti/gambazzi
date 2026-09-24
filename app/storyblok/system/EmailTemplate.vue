<template lang="pug">
.EmailTemplate(:style="{backgroundColor:blok.backgroundColor?.color}")
    .content(v-html="computedTemplate")
</template>
<script setup>

    const { blok } = defineProps(['blok']);
    const computedTemplate = computed(() => {
        let payload = {
            logo : blok?.logo?.filename,
            site : blok?.site,
            backgroundColor : blok?.backgroundColor?.color
        }

        if(blok.dummyData){
            const data = JSON.parse(blok.dummyData);
            payload = {
                ...payload,
                ...data
            }
        }
        return __textReplacer(blok.template,payload);
    })

    const __textReplacer = (str, values) => {
        const regex = /{{([^}]+)}}/g;
        values.site = values.host || `https://${values.site}`;
        return str?.replaceAll(regex, (match, property) => {
            var value = null;
            if(values && values[property]){
                value = values[property];
            }
            return value ?? match;
        });
    }
</script>
<style lang="scss">
.EmailTemplate{
    width: 100%;
    padding: mw(12) mw(2);
    box-sizing: border-box;
}
</style>