<template lang="pug">
img(
    v-if="image"
    :src="image.src"
    :srcset="image.srcset"
    :sizes="image.sizes"
    :width="image.width"
    :height="image.height"
    :alt="attrs?.alt || ''"
    :title="attrs?.title || undefined"
    :loading="isEager ? 'eager' : 'lazy'"
    :fetchpriority="isEager ? 'high' : 'low'"
    decoding="async"
)
</template>
<script setup>
    const { attrs } = defineProps(['attrs', '_key', 'context']);
    const config = useRichTextImageConfig();

    const image = computed(() => useStoryblokImage(attrs?.src, config.value.sizes));
    const isEager = computed(() => Boolean(config.value.eagerSrc) && attrs?.src === config.value.eagerSrc);
</script>
