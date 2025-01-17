'use client';

import { TensaiChatWindow } from '@/components/TensaiChatWindow';
import { Sidebar } from '@/components/Sidebar';

export default function AiChatPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="h-28 border-b flex items-center justify-center bg-black">
          <h1 className="text-3xl font-mono font-bold tracking-widest text-white">TensAI</h1>
        </div>
        <div className="flex-1">
          <TensaiChatWindow />
        </div>
      </div>
    </div>
  );
} 