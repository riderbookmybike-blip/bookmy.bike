import { PhoneSearch } from '@/components/phone/catalog/PhoneSearch';
import { FavoritesProvider } from '@/lib/favorites/favoritesContext';

export default function SearchPage() {
    return (
        <FavoritesProvider>
            <PhoneSearch />
        </FavoritesProvider>
    );
}
