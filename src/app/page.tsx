import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import StorePage from './store/page';
import StoreLayout from './store/layout';

export default async function RootPage() {
  // Detect mobile devices via user-agent
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // Redirect mobile users to /m
  if (isMobile) {
    redirect('/m');
  }

  // Desktop users see the store page
  return (
    <StoreLayout>
      <StorePage />
    </StoreLayout>
  );
}
