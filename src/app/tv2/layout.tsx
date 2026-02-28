import type { ReactNode } from 'react';
import TV2Shell from './TV2Shell';

export default function TV2Layout({ children }: { children: ReactNode }) {
    return <TV2Shell>{children}</TV2Shell>;
}
