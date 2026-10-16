export default defineNuxtRouteMiddleware((to, from) => {
    const { defaultLanguage, languages } = useLanguage();

    if(to.fullPath.includes('/api')) return;
    const segment = to.path.split('/')[1] || '';
    if(languages.value.includes(segment)) return;

    // un codice lingua non disponibile (es. /en/...) va sostituito con quella di default, non prefissato
    const rest = /^[a-z]{2}$/i.test(segment) ? to.fullPath.slice(segment.length + 1) : to.fullPath;
    return navigateTo(`/${defaultLanguage.value}${rest.startsWith('/') ? rest : `/${rest}`}`);
  });
