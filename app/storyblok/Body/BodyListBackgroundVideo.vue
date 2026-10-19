<template lang="pug">
.BodyListBackgroundVideo(v-editable="blok" :class="mw.classes" :style="mw.style")
    .background
        .video
            StoryblokComponent(v-if="blok.video?.[0]" :blok="blok.video[0]" v-editable="blok")
    .content
        .intro
            .title(v-if="blok.title?.length")
                StoryblokComponent(v-for="item in blok.title" :key="item._uid" :blok="item" v-editable="item")
        .body
            StoryblokComponent(v-for="item in blok.body" :key="item._uid" :blok="item" v-editable="item")
        .cta(v-if="blok.cta?.[0]")
            StoryblokComponent(:blok="blok.cta[0]" v-editable="blok.cta[0]")
</template>
<script setup>
    const {blok} = defineProps(["blok"]);
    const mw = useMwClass(() => blok.class);
</script>
<style lang="scss">
.BodyListBackgroundVideo{
    position: relative;
    width: 100%;
    padding-bottom: mw(20);
    .background{
        position: absolute;
        inset: 0;
        z-index: 0;
        .video{
            position: sticky;
            top: 0;
            height: 100vh;
            height: 100dvh;
            overflow: hidden;
            .SimpleVideo{
                height: 100%;
            }
        }
    }
    .content{
        position: relative;
        z-index: 1;
        padding: 0 mw(2);
        .intro{
            min-height: 50vh;
            .title{
                display: flex;
                justify-content: space-between;
                position: sticky;
                top: 0;
                padding-top: mw(1);
            }
        }
        .body{
            position: relative;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: mw(2);
            margin-bottom: mw(1);
            > .BodyColsWrap{
                > .BodyCols{
                    background: $greyLight;
                    padding: mw(1);
                    box-sizing: border-box;
                    border-radius: $dbr;
                    color: $white !important;

                    .BodySimpleText{
                        &:not(:first-of-type){
                            align-self: flex-end;
                        }
                    }
                }
            }
            
        }
        // stessa griglia del body: la CTA occupa la terza colonna
        .cta{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: mw(1);
            padding-bottom: mw(2);
            .BodyCTA{
                grid-column: 3;
            }
        }
    }
}
</style>
