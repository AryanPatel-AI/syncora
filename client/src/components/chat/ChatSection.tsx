import React, { useState, useRef, useEffect } from 'react';
import { useWatchParty } from '../../context/WatchPartyContext';
import {
  MessageSquare,
  Send,
  Crown,
  Shield,
  AlertCircle,
  Loader2,
  X,
  Pin,
  Trash2,
  Clock,
  PinOff,
  Sliders,
} from 'lucide-react';

export const ChatSection: React.FC = () => {
  const {
    chatHistory,
    sendChat,
    sendReaction,
    currentUser,
    isConnected,
    connectionError,
    isHost,
    isModerator,
    deleteMessage,
    pinMessage,
    timeoutUser,
    toggleSlowMode,
    slowModeSeconds,
    pinnedMessages,
  } = useWatchParty();

  const [inputText, setInputText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSlowModeMenuOpen, setIsSlowModeMenuOpen] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();

    if (!isConnected) {
      setErrorMessage('Cannot send message while disconnected from server.');
      return;
    }

    if (!trimmed) {
      setErrorMessage('Chat message cannot be empty.');
      return;
    }

    if (trimmed.length > 500) {
      setErrorMessage(`Message is too long (${trimmed.length}/500 characters).`);
      return;
    }

    setErrorMessage(null);
    sendChat(trimmed);
    setInputText('');
  };

  const userMessagesCount = chatHistory.filter((m) => m.type === 'user' && !m.isDeleted).length;
  const canModerate = isHost || isModerator;

  return (
    <div
      className="flex flex-col h-full rounded-xl bg-[#11221A] border border-[#234735] overflow-hidden shadow-cinema"
      aria-label="Room Discussion"
    >
      {/* Header */}
      <div className="p-3 border-b border-[#234735] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#34D399]" />
          <span className="text-xs font-mono uppercase tracking-wider text-[#D1FAE5] font-medium">
            Room Discussion
          </span>
          {slowModeSeconds > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#E5A84B]/15 text-[#E5A84B] border border-[#E5A84B]/30 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> {slowModeSeconds}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Host Slow Mode Control */}
          {isHost && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSlowModeMenuOpen((p) => !p)}
                className="p-1 rounded text-[#8E919C] hover:text-white hover:bg-[#234735] transition-colors"
                title="Configure Slow Mode"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              {isSlowModeMenuOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-[#193225] border border-[#234735] rounded-xl shadow-2xl p-1 z-30 flex flex-col gap-0.5 text-[11px]">
                  <span className="px-2 py-1 text-[9px] font-bold uppercase text-[#5E606A]">
                    Slow Mode
                  </span>
                  {[0, 5, 10, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        toggleSlowMode(sec);
                        setIsSlowModeMenuOpen(false);
                      }}
                      className={`px-2 py-1.5 rounded text-left transition-colors ${
                        slowModeSeconds === sec
                          ? 'bg-[#34D399]/15 text-[#34D399] font-bold'
                          : 'text-[#8E919C] hover:text-white hover:bg-[#234735]'
                      }`}
                    >
                      {sec === 0 ? 'Off (Normal)' : `${sec} seconds`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isConnected && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-[#F87171]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F87171] animate-pulse" />
              Offline
            </span>
          )}
          <span className="text-[11px] font-mono text-[#8E919C]">
            {userMessagesCount} msgs
          </span>
        </div>
      </div>

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div className="px-3 py-1.5 bg-[#34D399]/10 border-b border-[#34D399]/20 flex items-center justify-between text-xs text-[#34D399]">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3.5 h-3.5 shrink-0 text-[#34D399]" />
            <span className="truncate text-[11px] font-medium">
              <strong>{pinnedMessages[0].senderName}:</strong> {pinnedMessages[0].content}
            </span>
          </div>
          {canModerate && (
            <button
              onClick={() => pinMessage(pinnedMessages[0].id, false)}
              className="p-1 rounded text-[#8E919C] hover:text-white"
              title="Unpin message"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={chatScrollRef}
        tabIndex={0}
        aria-label="Message list"
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 focus:outline-none"
      >
        {!isConnected && chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 text-[#8E919C] gap-2">
            <Loader2 className="w-5 h-5 text-[#34D399] animate-spin" />
            <p className="text-xs font-medium text-[#D1FAE5]">Connecting to chat...</p>
          </div>
        ) : chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 text-[#8E919C] gap-1.5">
            <div className="w-9 h-9 rounded-full bg-[#193225] border border-[#234735] flex items-center justify-center text-[#5E606A] mb-1">
              <MessageSquare className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-[#D1FAE5]">Discussion is quiet</p>
            <p className="text-[11px] text-[#5E606A] max-w-[200px]">
              Notes and messages sent during the screening will appear here.
            </p>
          </div>
        ) : (
          chatHistory.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div
                  key={msg.id}
                  className="self-center px-2.5 py-1 rounded bg-[#193225]/80 border border-[#234735] text-[10px] font-mono text-[#8E919C] text-center max-w-[90%]"
                >
                  {msg.content || msg.text}
                </div>
              );
            }

            const isMe = msg.senderId === currentUser?.id;
            const displayName = isMe ? 'You' : msg.senderName || msg.username || 'Participant';
            const role = msg.senderRole || msg.role;

            return (
              <div
                key={msg.id}
                className={`group relative flex flex-col gap-1 max-w-[85%] ${
                  isMe ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 px-0.5">
                  <span className="text-[10px] font-medium text-[#8E919C]">
                    {displayName}
                  </span>

                  {role === 'HOST' && (
                    <span title="Room Host" className="text-[#E5A84B] flex items-center">
                      <Crown className="w-3 h-3" />
                    </span>
                  )}
                  {role === 'MODERATOR' && (
                    <span title="Moderator" className="text-[#82A8F8] flex items-center">
                      <Shield className="w-3 h-3" />
                    </span>
                  )}

                  <span className="text-[9px] font-mono text-[#5E606A]">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {/* Moderator Quick Actions overlay */}
                  {canModerate && !msg.isDeleted && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1 bg-[#09140F] border border-[#234735] rounded px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() => pinMessage(msg.id, !msg.isPinned)}
                        className={`p-0.5 hover:text-white ${msg.isPinned ? 'text-[#34D399]' : 'text-[#8E919C]'}`}
                        title={msg.isPinned ? 'Unpin' : 'Pin message'}
                      >
                        <Pin className="w-2.5 h-2.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteMessage(msg.id)}
                        className="p-0.5 text-[#8E919C] hover:text-[#EF4444]"
                        title="Delete message"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>

                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => timeoutUser(msg.senderId, 60)}
                          className="p-0.5 text-[#8E919C] hover:text-[#E5A84B]"
                          title="Timeout user for 60s"
                        >
                          <Clock className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div
                  className={`px-3 py-2 rounded-lg text-xs leading-relaxed break-words whitespace-pre-wrap ${
                    msg.isDeleted
                      ? 'bg-[#193225]/30 text-[#5E606A] italic border border-dashed border-[#234735]'
                      : isMe
                      ? 'bg-[#193225] text-[#D1FAE5] border border-[#2A5540]'
                      : 'bg-[#193225]/60 text-[#D1FAE5] border border-[#234735]'
                  }`}
                >
                  {msg.content || msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inline Error State */}
      {errorMessage && (
        <div className="px-3 py-1.5 bg-[#F87171]/10 border-t border-[#F87171]/20 flex items-center justify-between gap-2 text-xs text-[#F87171]">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#F87171]" />
            <span className="truncate text-[11px]">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-0.5 rounded text-[#F87171] hover:bg-[#F87171]/20 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-2.5 border-t border-[#234735] bg-[#11221A] flex flex-col gap-1.5">
        <div className="flex items-center gap-1 pb-1">
          <span className="text-[10px] font-mono text-[#5E606A] mr-1 uppercase">React</span>
          {['❤️', '🔥', '👏', '🎉', '🍿'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              disabled={!isConnected}
              onClick={() => sendReaction(emoji, emoji === '❤️' ? 'like' : 'emoji')}
              className="px-1.5 py-0.5 rounded text-xs hover:bg-[#224433] active:scale-90 transition-transform disabled:opacity-40"
              aria-label={`Send ${emoji} reaction`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder={isConnected ? 'Send note to room...' : 'Connecting to chat...'}
            value={inputText}
            maxLength={500}
            disabled={!isConnected}
            onChange={handleInputChange}
            className="flex-1 px-3 py-2 rounded-md bg-[#09140F] border border-[#234735] focus:border-[#34D399] text-xs text-[#D1FAE5] placeholder:text-[#5E606A] outline-none transition-colors disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className="px-3.5 py-2 min-h-[34px] rounded-md bg-[#34D399] hover:bg-[#2BBF88] text-[#09140F] font-medium text-xs disabled:opacity-30 transition-colors flex items-center justify-center shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export const ChatPanel = ChatSection;
