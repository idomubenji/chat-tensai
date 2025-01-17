import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function TensaiButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/ai');
  };

  return (
    <Button
      onClick={handleClick}
      className="bg-black hover:bg-gray-800 text-white rounded-lg px-4 py-2 font-['Cinzel']"
    >
      TensAI
    </Button>
  );
} 