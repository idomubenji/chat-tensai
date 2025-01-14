import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function TopBar() {
  return (
    <div className="flex items-center justify-center p-4 border-b">
      <div className="flex items-center w-full max-w-md">
        <Input type="text" placeholder="Search..." className="mr-2" />
        <Button size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

