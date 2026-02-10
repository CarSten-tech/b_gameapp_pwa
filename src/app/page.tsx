import { GameContainer } from '@/components/engine/GameContainer';
import { ViewSwitcher } from '@/components/engine/ViewSwitcher';

export default function Home() {
  return (
    <GameContainer>
      <ViewSwitcher />
    </GameContainer>
  );
}
