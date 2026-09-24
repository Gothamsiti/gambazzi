<template lang="pug">
.BodyAnnunciListItem
    .gallery(v-if="content.gallery?.length")
        GothamCarousel(
            v-slot="{ item, index }"
            :items="content.gallery"
            arrows
            dots
            loop
            prev-icon="gotham:circle-arrow-right"
            next-icon="gotham:circle-arrow-right"
            :prev="{ 'aria-label': $__('annunciGalleryPrev') }"
            :next="{ 'aria-label': $__('annunciGalleryNext') }"
        )
            imageItem(
                :blok="item"
                :priority="index === 0"
                sizes="(max-width: 768px) 100vw, 50vw"
            )
    .card
        .head
            .code(v-if="content.code") {{ content.code }}
            h3.h5(v-if="content.title") {{ content.title }}
            p.energyClass(v-if="content.energyClass")
                | {{ $__('annunciEnergyClass') }} 
                strong {{ content.energyClass }}
            p.h5.price(v-if="content.price")
                strong € {{ content.price }}
        .body
            .description(v-if="content.description")
                StoryblokRichText(:document="content.description")
            BodyCTA.tour(v-if="tourUrl" :blok="virtualTourCTA" @click.capture.prevent="tourOpen = true")
        .properties
            template(v-for="(property, key) in properies" :key="key")
                p.item(v-if="property?.value")
                    | {{ $__(property.label) }} 
                    strong {{ property.value }}
        .footer
            p.footer__financing(v-if="content.financingMonthlyPayment")
                | {{ $__('annunciFinancing') }} 
                strong {{ content.financingMonthlyPayment }}
            p.footer__ref(v-if="content.referenceCode")
                | {{ $__('annunciReference') }} 
                strong {{ content.referenceCode }}
        BodyCTA.contact.black(:blok="contactCTA")
    Teleport(to="body")
        .BodyAnnunciListItemTour(v-if="tourOpen" @click.self="tourOpen = false")
            .frame(:class="{ loaded: tourLoaded }")
                p.loader(v-if="!tourLoaded" v-html="$__('loading')")
                iframe(:src="tourUrl" width="100%" height="100%" frameborder="0" allowfullscreen allow="gyroscope; accelerometer; magnetometer" @load="tourLoaded = true")
            .close(@click="tourOpen = false")
</template>
<script setup>
    const {blok} = defineProps(["blok"]);
    const { $__ } = useNuxtApp();

    const content = computed(() => blok?.content || {});

    // piano numerico -> "1°", piano terra ("T") lasciato invariato
    const floor = computed(() => /^\d+$/.test(content.value.floor) ? `${content.value.floor}°` : content.value.floor);

    const contactCTA = computed(() => ({
        label: $__('annunciContact'),
        icon: 'gotham:hand-down',
        link: { cached_url: $__('annunciContactLink') },
    }));

    const tourUrl = computed(() => content.value.virtualTour?.url || content.value.virtualTour?.cached_url);
    const tourOpen = ref(false);
    // finché l'iframe non ha caricato mostriamo un fondo pieno con messaggio di caricamento
    const tourLoaded = ref(false);

    // blocca lo scroll della pagina e chiude con Esc mentre il virtual tour è aperto
    const onKeydown = (e) => { if (e.key === 'Escape') tourOpen.value = false; };
    watch(tourOpen, (open) => {
        if (open) tourLoaded.value = false;
        document.documentElement.style.overflow = open ? 'hidden' : '';
        window[open ? 'addEventListener' : 'removeEventListener']('keydown', onKeydown);
    });
    onUnmounted(() => {
        if (!tourOpen.value) return;
        document.documentElement.style.overflow = '';
        window.removeEventListener('keydown', onKeydown);
    });

    const virtualTourCTA = computed(() => ({
        label: $__('annunciVirtualTour'),
        icon: 'gotham:resize',
        link: { ...content.value.virtualTour, target: '_blank' },
        class: 'reverse',
    }));

    const properies = computed(() => ({
        surfaceArea: {
            label: $__('annunciSurface'),
            value: content.value.surfaceArea
        },
        floor: {
            label: $__('annunciFloor'),
            value: content.value.floor
        },
        bathrooms: {
            label: $__('annunciBathrooms'),
            value: content.value.bathrooms
        },
        outdoorSpace: {
            label: $__('annunciOutdoorSpace'),
            value: content.value.outdoorSpace
        },
        propertyUse: {
            label: $__('annunciPropertyUse'),
            value: content.value.propertyUse
        },
    }));
</script>
<style lang="scss">
.BodyAnnunciListItem{
    width: mw(30);
    flex: 0 0 mw(30);
    display: flex;
    flex-direction: column;
    gap: mw(1);
    align-self: stretch;
    >.gallery{
        [data-slot="root"]{
            position: relative;
        }
        [data-slot="viewport"]{
            overflow: hidden;
        }
        [data-slot="container"]{
            display: flex;
            touch-action: pan-y pinch-zoom;
        }
        [data-slot="item"]{
            // l'area è sempre 1:1: l'immagine è in absolute così le sue dimensioni non influenzano l'altezza
            position: relative;
            flex: 0 0 100%;
            min-width: 0;
            min-height: 0;
            aspect-ratio: 1 / 1;
            max-height: 600px;
            overflow: hidden;
            .imageItem{
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                img{
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }
        }
        [data-slot="prev"],
        [data-slot="next"]{
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: mw(1);
            border: 0;
            background: transparent;
            color: $white;
            font-size: 4.8rem;
            cursor: pointer;
            transition: opacity $dt $de;
            > *{
                font-size: mw(2);
            }
            &:disabled{
                opacity: .3;
                cursor: default;
            }
        }
        &:has([data-slot="prev"]:disabled):has([data-slot="next"]:disabled) {
            [data-slot="prev"],
            [data-slot="next"]{
                opacity: 0;
                pointer-events: none;
            }
        }
        [data-slot="prev"]{
            left: 0;
            >*{
                transform: rotate(180deg);
            }
        }
        [data-slot="next"]{
            right: 0;
        }
        [data-slot="dots"]{
            display: flex;
            gap: mw(.5);
            margin-top: mw(.5);
        }
        [data-slot="dot"]{
            flex: 1 1 0;
            height: 3px;
            padding: 0;
            border: 0;
            background: $bkg;
            cursor: pointer;
            transition: background $dt $de;
            &[data-state="active"]{
                background: $greyDark;
                &:first-child:last-child{
                    opacity:0;
                    pointer-events: none;
                }
            }
        }
    }
    >.card{
        align-self: stretch;
        display: flex;
        flex-direction: column;
        background: rgba($black,0.05);
        padding: mw(1);
        gap:mw(3);
        flex:1;
        box-sizing: border-box;
        >.head{
            display: grid;
            grid-template-columns: auto auto;
            gap: 0;
            justify-content: space-between;
            >*{
                margin: 0;
            }
            >.code{
                font-family: $font-serif;
                font-style: normal;
                font-weight: 700;
                font-size: 6rem;
                line-height: 6rem;
                leading-trim: both;
                text-edge: cap;
                font-feature-settings: 'pnum' on, 'lnum' on;
                color: rgba($black,.1);
                font-variation-settings: 'opsz' 11;
            }
            >.energyClass,>.price{
                align-self: end;
            }
            >.price{
                justify-self: end;
            }
        }
        >.body{
            display: flex;
            flex-direction: column;
            gap: mw(1);
            *{
                font-size: 1.6rem;
            }
            >.tour{
                align-self: flex-end;
            }
        }
        >.properties{
            display: flex;
            flex-wrap: wrap;
            gap: .2rem;
            *{
                margin: 0;
                min-width: 45%;
            }
        }
        >.footer{
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: $greyMiddle;
            >*{
                margin: 0;
            }
        }
        >.contact{
            align-self: flex-start;
            justify-self: flex-start;
            margin-top: auto;
        }
    }
    &.work >.card >.head >.code{
        color: rgba($white,.1);
    }
}
.BodyAnnunciListItemTour{
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    z-index: 10;
    padding: mw(2);
    box-sizing: border-box;
    background: #00000044;
    >.frame{
        position: relative;
        width: 100%;
        height: 100%;
        background: $black;
        >.loader{
            position: absolute;
            inset: 0;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: $white;
            font-size: 1.6rem;
            text-transform: uppercase;
            animation: BodyAnnunciListItemTourPulse 1.2s ease-in-out infinite alternate;
        }
        >iframe{
            position: relative;
            display: block;
            border: 0;
            opacity: 0;
            transition: opacity $dt $de;
        }
        &.loaded >iframe{
            opacity: 1;
        }
    }
    .close{
        @include modalClose(mw(2));
    }
}
@keyframes BodyAnnunciListItemTourPulse{
    from{ opacity: .3; }
    to{ opacity: 1; }
}
</style>
