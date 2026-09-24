export default defineNuxtPlugin(() => {
    // init() registra i listener di resize/scroll che alimentano `sizes` e `scroll`.
    // Va chiamato una volta sola per app: due chiamate = due listener, e il secondo
    // scrollListener calcolerebbe la direzione confrontando il top con se stesso
    // (quindi sempre -1). Prima stava dentro BodyScrollingFrames.
    useSizes().init();
});
