import StorePage from './store/page';
import StoreLayout from './store/layout';

export default function RootPage() {
    return (
        <StoreLayout>
            <StorePage />
        </StoreLayout>
    );
}
