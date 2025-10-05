"use client";

import { Chat } from "@/components/chat/chat";
import Container from "@/components/ui/container";

export default function ChatPage() {


  return (
    <main className="flex-1">
      <div>
        <Container className="-translate-y-10 relative overflow-visible z-[999]">
          <Chat />
        </Container>
      </div>
    </main>
  );
}
