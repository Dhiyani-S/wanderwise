import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GREETING = "Hello! I'm Wise Bot, your AI travel assistant. Ask me about places, food, travel tips, or itineraries. 🌍";

const WiseBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("wise-bot-chat", {
        body: { messages: updated.map((m) => ({ role: m.role, content: m.content })) },
      });

      if (error) throw error;

      if (data?.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      console.error("WiseBot error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." },
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-hero text-primary-foreground shadow-glow flex items-center justify-center"
          >
            <MessageCircle size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-3 left-3 z-50 max-w-sm mx-auto bg-card border border-border rounded-2xl shadow-elevated flex flex-col overflow-hidden"
            style={{ maxHeight: "70vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-hero text-primary-foreground">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <div>
                  <p className="font-semibold text-sm font-display">Wise Bot</p>
                  <p className="text-[10px] opacity-80">AI Travel Assistant</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[50vh]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-hero text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground px-3 py-2 rounded-2xl rounded-bl-md text-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about places, food, tips..."
                className="flex-1 h-10 px-3 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-gradient-hero text-primary-foreground flex items-center justify-center disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WiseBot;
