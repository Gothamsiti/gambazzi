export const useAppLayout = () => {
    const menuOpen = useState('menuOpen', () => false);
    const modalOpen = useState('modalOpen', () => false);
    return {
        menuOpen,
        modalOpen
    }
}
