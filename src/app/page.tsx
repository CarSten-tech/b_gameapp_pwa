import { Nippelboard } from '@/components/nippelboard/Nippelboard';
import { OrientationGuard } from '@/components/nippelboard/OrientationGuard';

export default function Home() {
  return (
    <main className="h-screen w-screen bg-black overflow-hidden touch-none selection:none">
      <OrientationGuard>
        <Nippelboard />
      </OrientationGuard>
    </main>
  );
}
