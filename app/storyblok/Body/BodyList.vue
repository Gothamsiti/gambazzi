<template lang="pug">
ul.BodyList(v-editable="blok" :class="mw.classes" :style="mw.style")
    li.item(v-for="item in blok.items" :key="item._uid" v-editable="item") {{ item.text }}
</template>
<script setup>
    const {blok} = defineProps(["blok"]);
    const mw = useMwClass(() => blok.class);
</script>
<style lang="scss">
.BodyList{
    flex: 1;
    margin: 0;
    padding: 0;
    list-style: none;
    color: $white;
    .item{
        display: flex;
        align-items: center;
        gap: mw(.8);
        padding: mw(1.5) 0;
        font-size: 2.2rem;
        line-height: 1em;
        text-transform: uppercase;
        border-bottom: 1px solid currentColor;
        &:first-child{
            padding-top: 0;
        }
        &::before{
            content: '';
            flex: 0 0 auto;
            width: .55em;
            height: .55em;
            border-radius: 50%;
            background: currentColor;
        }
    }
}
</style>
