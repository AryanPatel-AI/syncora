import React, { useState, useRef, useEffect } from 'react';
import { useWatchParty } from '../context/WatchPartyContext';
import { MessageSquare, Send, Sparkles, Crown, Shield } from 'lucide-react';

const EMOJI_LIST = ['❤️', '🔥', '😂', '👏', '🍿', '🚀', '🎉', '🙌'];

export const ChatPanel: React.FC = () => {
  const { chatHistory, sendChat, sendReaction, currentUser } = useWatchParty();
  const [inputText, setInputText] = useState<string>('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll on new message
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChat(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-brand-surface/50 rounded-2xl border border-brand-border/60 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-brand-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-primary/20 text-brand-highlight">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">Live Chat</span>
        </div>
        <span className="text-[11px] text-brand-muted">Real-time</span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 text-brand-muted">
            <Sparkles className="w-8 h-8 text-brand-border mb-2" />
            <p className="text-xs">No messages yet. Say hello or share your thoughts!</p>
          </div>
        )}

        {chatHistory.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className="self-center px-3 py-1 rounded-full bg-brand-surface/70 border border-brand-border/40 text-[11px] text-brand-highlight/90 text-center select-none"
              >
                {msg.content}
              </div>
            );
          }

          const isMe = msg.senderId === currentUser?.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-[10px] font-semibold text-brand-muted">
                  {isMe ? 'You' : msg.senderName}
                </span>
                {msg.senderRole === 'HOST' && (
                  <Crown className="w-2.5 h-2.5 text-amber-300" />
                )}
                {msg.senderRole === 'MODERATOR' && (
                  <Shield className="w-2.5 h-2.5 text-cyan-400" />
                )}
              </div>

              <div
                className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                  isMe
                    ? 'bg-brand-primary text-white rounded-tr-none'
                    : 'bg-brand-card text-brand-text border border-brand-border/60 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Emoji Reactions Bar */}
      <div className="px-3 py-2 border-t border-brand-border/40 bg-brand-surface/30 flex items-center justify-between gap-1 overflow-x-auto">
        <span className="text-[10px] text-brand-subtle select-none hidden sm:inline">React:</span>
        <div className="flex items-center gap-1 w-full justify-around sm:justify-start">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="p-1 hover:bg-brand-surface rounded-lg transition-transform hover:scale-125 active:scale-95 text-base select-none"
              title={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-brand-border/50 bg-brand-surface/70 flex gap-2">
        <input
          type="text"
          placeholder="Send a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-3.5 py-2 rounded-xl bg-brand-dark/70 border border-brand-border/80 focus:border-brand-primary text-xs text-white placeholder:text-brand-subtle outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-brand-primary hover:bg-brand-hover text-white disabled:opacity-40 disabled:hover:bg-brand-primary transition-all flex items-center justify-center shadow-glow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
