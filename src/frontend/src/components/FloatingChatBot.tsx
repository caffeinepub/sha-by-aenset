import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Entry, FinanceSummary, Note, Task } from "../backend.d";
import { useActor } from "../hooks/useActor";
import {
  useGetAllEntries,
  useGetAllNotes,
  useGetAllTasks,
  useGetSummary,
} from "../hooks/useQueries";
import { parseDateInput } from "../utils/dateParser";

interface FloatingChatBotProps {
  userName: string;
}

interface Message {
  role: "assistant" | "user";
  text: string;
  id: number;
}

const TIPS = [
  "Break big goals into small daily actions — consistency beats intensity.",
  "Review your finances weekly to stay aware of your spending patterns.",
  "Write down at least one thing you're grateful for each day.",
  "Tackle your hardest task first thing in the morning when energy is high.",
  "A 10-minute walk can reset your focus better than another coffee.",
  "Use the 2-minute rule: if a task takes less than 2 minutes, do it now.",
  "Keep your notes organized in folders so you can find them quickly.",
  "Set a weekly budget review — even 5 minutes keeps surprises away.",
  "Celebrate small wins; momentum comes from recognizing progress.",
  "Plan tomorrow the night before so you wake up with clear intent.",
];

let tipIndex = 0;
function nextTip() {
  const tip = TIPS[tipIndex % TIPS.length];
  tipIndex++;
  return tip;
}

function generateResponse(
  input: string,
  data: {
    tasks: Task[];
    notes: Note[];
    entries: Entry[];
    summary: FinanceSummary | undefined;
    userName: string;
  },
): string {
  const q = input.toLowerCase().trim();
  const { tasks, notes, entries, summary, userName } = data;

  if (/^(hi|hello|hey|sup|howdy)/.test(q)) {
    return `Hey ${userName}! I'm Sha, your personal assistant. Ask me about your tasks, notes, or finances!`;
  }

  if (/balance|money|spend|income|expense|finance|budget|cash/.test(q)) {
    if (!summary) {
      return "I couldn't load your finance data right now. Try again in a moment.";
    }
    const balance = summary.balance.toFixed(2);
    const inc = summary.totalIncome.toFixed(2);
    const exp = summary.totalExpenses.toFixed(2);
    let reply = `Your current balance is $${balance}\nTotal income: $${inc}\nTotal expenses: $${exp}`;
    if (/recent|last|entr/.test(q) && entries.length > 0) {
      const recent = [...entries]
        .sort((a, b) => Number(b.timestamp - a.timestamp))
        .slice(0, 3);
      reply += `\n\nRecent entries:\n${recent
        .map(
          (e) =>
            `- ${e.description || e.category}: $${e.amount.toFixed(2)} (${e.entryType})`,
        )
        .join("\n")}`;
    }
    return reply;
  }

  if (/task|todo|planner|schedule|today|checklist/.test(q)) {
    if (tasks.length === 0) {
      return "You have no tasks yet! Head to the Planner tab to add some.";
    }
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    const pending = tasks.filter((t) => !t.completed);
    let reply = `You have ${total} tasks (${done} completed, ${total - done} pending).`;
    if (pending.length > 0) {
      const titles = pending
        .slice(0, 5)
        .map((t) => `- ${t.title}`)
        .join("\n");
      reply += `\n\nPending:\n${titles}`;
      if (pending.length > 5) reply += `\n- ...and ${pending.length - 5} more`;
    }
    return reply;
  }

  if (/note|notes|folder/.test(q)) {
    if (notes.length === 0) {
      return "You haven't created any notes yet. Head to the Notes tab to start writing!";
    }
    const recent = [...notes]
      .sort((a, b) => Number(b.timestamp - a.timestamp))
      .slice(0, 3);
    const titles = recent.map((n) => `- ${n.title || "Untitled"}`).join("\n");
    return `You have ${notes.length} notes. Recent ones:\n${titles}`;
  }

  if (/advice|tip|motivat|help|how|should|suggest|idea/.test(q)) {
    return `Here's a tip for you:\n\n"${nextTip()}"`;
  }

  if (/summar|overview|status|how am i|dashboard/.test(q)) {
    const pendingCount = tasks.filter((t) => !t.completed).length;
    const balance = summary ? `$${summary.balance.toFixed(2)}` : "unavailable";
    return `Overview for ${userName}:\n- Pending tasks: ${pendingCount}\n- Notes saved: ${notes.length}\n- Current balance: ${balance}`;
  }

  return 'I can help you with your tasks, notes, and finances. Try asking:\n- "What are my tasks today?"\n- "What\'s my balance?"\n- "Show me my recent notes"\n- "Give me a productivity tip"';
}

export default function FloatingChatBot({ userName }: FloatingChatBotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [msgId, setMsgId] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  // Track message count in a ref so the scroll effect only depends on `open`
  const msgCountRef = useRef(0);
  msgCountRef.current = messages.length;

  const { actor } = useActor();
  const { data: tasks = [] } = useGetAllTasks();
  const { data: rawNotes = [] } = useGetAllNotes();
  const { data: entries = [] } = useGetAllEntries();
  const { data: summary } = useGetSummary();

  const notes = rawNotes as Note[];

  // Show welcome message when panel first opens
  useEffect(() => {
    if (open && msgCountRef.current === 0) {
      setMessages([
        {
          role: "assistant",
          id: 0,
          text: `Hi ${userName}! I'm Sha, your personal assistant. I can help you check your tasks, notes, and finances. What would you like to know?`,
        },
      ]);
      setMsgId(1);
    }
  }, [open, userName]);

  // Scroll to bottom whenever messages change
  const scrollToBottom = () =>
    setTimeout(
      () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
      60,
    );

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: "user", text, id: msgId };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    let nextId = msgId + 1;

    // Intent: create note
    const noteMatch = text.match(/^(?:create|add|make a?|new) note[:\s]+(.+)/i);
    if (noteMatch && actor) {
      const title = noteMatch[1].trim();
      try {
        const a = actor as any;
        await a.createNote(title, "", BigInt(0), []);
        const botMsg: Message = {
          role: "assistant",
          text: `✅ Created note: "${title}"`,
          id: nextId,
        };
        setMessages((prev) => [...prev, botMsg]);
        setMsgId(nextId + 1);
        scrollToBottom();
        return;
      } catch {
        /* fall through */
      }
    }

    // Intent: create task
    const taskMatch = text.match(
      /^(?:add|create|remind me to) task[:\s]+(.+)|^(?:remind me to) (.+)/i,
    );
    const taskTitle = taskMatch?.[1] || taskMatch?.[2];
    if (taskTitle && actor) {
      const dateWords = taskTitle.match(
        /(?:on|for|next|tomorrow|today) (.+)$/i,
      );
      const rawDate = dateWords ? dateWords[0].replace(/^(on|for) /i, "") : "";
      const parsedDate = rawDate
        ? parseDateInput(rawDate)
        : new Date().toISOString().split("T")[0];
      const cleanTitle = dateWords
        ? taskTitle.replace(dateWords[0], "").trim()
        : taskTitle.trim();
      try {
        await actor.createTask(cleanTitle || taskTitle.trim(), "", parsedDate);
        const botMsg: Message = {
          role: "assistant",
          text: `✅ Added task: "${cleanTitle || taskTitle.trim()}" for ${parsedDate}`,
          id: nextId,
        };
        setMessages((prev) => [...prev, botMsg]);
        setMsgId(nextId + 1);
        scrollToBottom();
        return;
      } catch {
        /* fall through */
      }
    }

    const response = generateResponse(text, {
      tasks,
      notes,
      entries,
      summary,
      userName,
    });
    const botMsg: Message = { role: "assistant", text: response, id: nextId };
    setMessages((prev) => [...prev, botMsg]);
    setMsgId(nextId + 1);
    scrollToBottom();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <>
      <motion.button
        type="button"
        data-ocid="chatbot.open_modal_button"
        onClick={() => {
          setOpen(true);
          scrollToBottom();
        }}
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        aria-label="Open Sha Assistant"
        style={{ display: open ? "none" : "flex" }}
      >
        <MessageCircle className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            data-ocid="chatbot.modal"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 flex flex-col bg-background border-t border-x border-border rounded-t-2xl shadow-2xl"
            style={{ height: "75dvh" }}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-none">
                    Sha Assistant
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Your personal helper
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-ocid="chatbot.close_button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-accent text-accent-foreground rounded-br-sm"
                          : "bg-card border border-border text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            </ScrollArea>

            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-t border-border">
              <Input
                data-ocid="chatbot.input"
                placeholder="Ask me anything…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 h-9 text-sm"
                autoComplete="off"
              />
              <Button
                data-ocid="chatbot.submit_button"
                size="icon"
                className="h-9 w-9 bg-accent text-accent-foreground hover:bg-accent/90 flex-shrink-0"
                onClick={sendMessage}
                disabled={!input.trim()}
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
