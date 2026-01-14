import StorePage from './store/page';
import StoreLayout from './store/layout';

export default async function RootPage() {
  return (
    <StoreLayout>
      <StorePage />
    </StoreLayout>
  );
}
