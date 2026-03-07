import { redirect } from 'next/navigation';

export default function WishlistPage() {
    redirect('/store/compare?tab=wishlist');
}
