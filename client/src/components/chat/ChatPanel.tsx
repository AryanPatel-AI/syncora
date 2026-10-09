import React, { useState, useRef, useEffect } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import { REACTION_EMOJIS } from '../../utils/constants';
import { MessageSquare, Send, Sparkles, Crown, Shield, Smile } from 'lucide-react';

export const ChatPanel: React.FC = () => {
  const { chatHistory, sendChat, sendReaction, currentUser } = useWatchParty();
  const [inputText, setInputText] = useState<string>('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    <div className="flex flex-col h-full glass-panel-elevated rounded-3xl border border-brand-border/70 overflow-hidden shadow-2xl backdrop-blur-2xl">
      {/* Header */}
      <div className="p-4 border-b border-brand-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-primary/20 text-brand-highlight">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white tracking-wide">Live Party Chat</span>
            <div className="flex items-center gap-1.5 text-[10px] text-brand-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time Stream</span>
            </div>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-brand-surface text-brand-muted border border-brand-border/60">
          {chatHistory.filter((m) => m.type === 'user').length} msgs
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 scrollbar-thin">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 text-brand-muted">
            <div className="p-4 rounded-3xl bg-brand-surface/60 border border-brand-border/50 mb-3 shadow-inner">
              <Sparkles className="w-8 h-8 text-brand-highlight animate-pulse" />
            </div>
            <p className="text-xs font-bold text-white">Party chat is quiet</p>
            <p className="text-[11px] text-brand-subtle max-w-[200px] mt-1">
              Drop a comment, invite friends, or react with floating emojis!
            </p>
          </div>
        )}

        {chatHistory.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className="self-center px-3.5 py-1 rounded-full bg-brand-surface/90 border border-brand-border/60 text-[11px] font-medium text-brand-highlight/90 text-center select-none shadow-sm"
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
              <div className="flex items-center gap-1.5 px-1.5">
                <span className="text-[10px] font-bold text-brand-muted">
                  {isMe ? 'You' : msg.senderName}
                </span>

                {msg.senderRole === 'HOST' && (
                  <span title="Host" className="text-amber-300">
                    <Crown className="w-3 h-3 fill-current" />
                  </span>
                )}
                {msg.senderRole === 'MODERATOR' && (
                  <span title="Moderator" className="text-cyan-400">
                    <Shield className="w-3 h-3 fill-current" />
                  </span>
                )}

                <span className="text-[9px] text-brand-subtle">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div
                className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-md transition-all ${
                  isMe
                    ? 'bg-gradient-to-tr from-brand-primary to-brand-hover text-white rounded-tr-none shadow-glow-sm'
                    : 'bg-brand-card text-brand-text border border-brand-border/70 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Emoji Reactions Dock */}
      <div className="px-3.5 py-2.5 border-t border-brand-border/40 bg-brand-surface/40 flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center gap-1 text-[10px] text-brand-highlight font-bold mr-1 select-none flex-shrink-0">
          <Smile className="w-3.5 h-3.5" />
          <span>React:</span>
        </div>

        <div className="flex items-center gap-1.5 w-full justify-around">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="p-1 hover:bg-brand-surface/90 rounded-xl transition-all hover:scale-135 active:scale-95 text-lg select-none flex-shrink-0"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSend} className="p-3.5 border-t border-brand-border/50 bg-brand-surface/80 flex gap-2">
        <input
          type="text"
          placeholder="Type a message to the room..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-brand-dark/70 border border-brand-border/80 focus:border-brand-primary text-xs text-white placeholder:text-brand-subtle outline-none transition-all shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-highlight hover:from-brand-hover hover:to-brand-primary text-white disabled:opacity-40 disabled:hover:from-brand-primary transition-all flex items-center justify-center shadow-glow-sm hover:scale-105 active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
