import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { getAuthErrorMessage } from '../services/authService';
import { api } from '../services/api';

type ChatRole = 'user' | 'assistant';

type ApiChatMessage = {
  role: ChatRole;
  content: string;
  timestamp: string;
};

type ApiChatConversation = {
  id: string;
  title: string;
  messages: ApiChatMessage[];
  createdAt: string;
  updatedAt: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type MarkdownPart =
  | {
      type: 'code';
      language: string;
      content: string;
    }
  | {
      type: 'text';
      content: string;
    };

const emptyError = '';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function getPreview(conversation: ApiChatConversation) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  if (!lastMessage) {
    return 'No messages yet';
  }

  const preview = lastMessage.content.replace(/\s+/g, ' ').trim();
  return preview.length > 80 ? `${preview.slice(0, 77)}...` : preview;
}

function parseMarkdownParts(content: string): MarkdownPart[] {
  const parts: MarkdownPart[] = [];
  const codeBlockPattern = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match = codeBlockPattern.exec(content);

  while (match) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      });
    }

    parts.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].replace(/\s+$/, '')
    });
    lastIndex = match.index + match[0].length;
    match = codeBlockPattern.exec(content);
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content }];
}

function renderInlineMarkdown(text: string) {
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return segments.map((segment, index) => {
    if (segment.startsWith('`') && segment.endsWith('`')) {
      return (
        <code key={`${segment}-${index}`} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-900">
          {segment.slice(1, -1)}
        </code>
      );
    }

    if (segment.startsWith('**') && segment.endsWith('**')) {
      return (
        <strong key={`${segment}-${index}`} className="font-semibold text-slate-950">
          {segment.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    const items = listItems;
    listItems = [];
    nodes.push(
      <ul key={`list-${nodes.length}`} className="my-3 list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
  }

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushList();
      return;
    }

    const listMatch = /^[-*]\s+(.+)$/.exec(trimmedLine);

    if (listMatch) {
      listItems.push(listMatch[1]);
      return;
    }

    flushList();

    if (trimmedLine.startsWith('### ')) {
      nodes.push(
        <h4 key={`h4-${index}`} className="mb-2 mt-4 text-base font-semibold text-slate-950">
          {renderInlineMarkdown(trimmedLine.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmedLine.startsWith('## ')) {
      nodes.push(
        <h3 key={`h3-${index}`} className="mb-2 mt-4 text-lg font-semibold text-slate-950">
          {renderInlineMarkdown(trimmedLine.slice(3))}
        </h3>
      );
      return;
    }

    if (trimmedLine.startsWith('# ')) {
      nodes.push(
        <h2 key={`h2-${index}`} className="mb-2 mt-4 text-xl font-semibold text-slate-950">
          {renderInlineMarkdown(trimmedLine.slice(2))}
        </h2>
      );
      return;
    }

    nodes.push(
      <p key={`p-${index}`} className="my-2 leading-7">
        {renderInlineMarkdown(trimmedLine)}
      </p>
    );
  });

  flushList();

  return <>{nodes}</>;
}

function CodeBlock({
  content,
  language,
  codeKey,
  copiedKey,
  onCopy
}: {
  content: string;
  language: string;
  codeKey: string;
  copiedKey: string;
  onCopy: (codeKey: string, content: string) => void;
}) {
  return (
    <div className="my-4 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-2">
        <span className="truncate text-xs font-semibold uppercase text-slate-300">{language}</span>
        <button
          type="button"
          className="rounded-md border border-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
          onClick={() => onCopy(codeKey, content)}
        >
          {copiedKey === codeKey ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto p-4 text-sm leading-6 text-slate-100">
        <code>{content}</code>
      </pre>
    </div>
  );
}

function MessageContent({ content, messageKey }: { content: string; messageKey: string }) {
  const [copiedKey, setCopiedKey] = useState('');
  const parts = useMemo(() => parseMarkdownParts(content), [content]);

  async function handleCopy(codeKey: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedKey(codeKey);
      window.setTimeout(() => setCopiedKey(''), 1600);
    } catch {
      setCopiedKey('');
    }
  }

  return (
    <div className="text-sm leading-6">
      {parts.map((part, index) =>
        part.type === 'code' ? (
          <CodeBlock
            key={`${messageKey}-code-${index}`}
            codeKey={`${messageKey}-code-${index}`}
            content={part.content}
            copiedKey={copiedKey}
            language={part.language}
            onCopy={handleCopy}
          />
        ) : (
          <MarkdownText key={`${messageKey}-text-${index}`} content={part.content} />
        )
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
      <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-600" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-600 [animation-delay:120ms]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-600 [animation-delay:240ms]" />
      <span className="ml-1 font-medium">PrepAI is typing</span>
    </div>
  );
}

export function AiChatbot() {
  const [conversations, setConversations] = useState<ApiChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(emptyError);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? null;

  useEffect(() => {
    let ignore = false;

    async function loadConversations() {
      try {
        setIsLoadingHistory(true);
        const response = await api.get<ApiEnvelope<{ conversations: ApiChatConversation[] }>>('/chat');

        if (ignore) {
          return;
        }

        setConversations(response.data.data.conversations);
        setActiveConversationId((currentId) => currentId ?? response.data.data.conversations[0]?.id ?? null);
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getAuthErrorMessage(error, 'Unable to load chat history.'));
        }
      } finally {
        if (!ignore) {
          setIsLoadingHistory(false);
        }
      }
    }

    loadConversations();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeConversation?.messages.length, isSending]);

  function upsertConversation(conversation: ApiChatConversation) {
    setConversations((currentConversations) => {
      const withoutConversation = currentConversations.filter((item) => item.id !== conversation.id);
      return [conversation, ...withoutConversation].sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      );
    });
    setActiveConversationId(conversation.id);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draftMessage.trim();

    if (!message || isSending) {
      return;
    }

    const temporaryConversationId = activeConversation?.id ?? 'new';
    const optimisticMessage: ApiChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    const optimisticConversation: ApiChatConversation =
      activeConversation ??
      {
        id: temporaryConversationId,
        title: 'New Chat',
        messages: [],
        createdAt: optimisticMessage.timestamp,
        updatedAt: optimisticMessage.timestamp
      };

    setErrorMessage(emptyError);
    setDraftMessage('');
    setIsSending(true);

    if (!activeConversation) {
      setActiveConversationId(temporaryConversationId);
      setConversations((currentConversations) => [
        {
          ...optimisticConversation,
          messages: [optimisticMessage]
        },
        ...currentConversations
      ]);
    } else {
      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                messages: [...conversation.messages, optimisticMessage],
                updatedAt: optimisticMessage.timestamp
              }
            : conversation
        )
      );
    }

    try {
      const response = await api.post<ApiEnvelope<{ conversation: ApiChatConversation }>>('/chat', {
        message,
        ...(activeConversation?.id ? { conversationId: activeConversation.id } : {})
      });
      const conversation = response.data.data.conversation;

      setConversations((currentConversations) =>
        currentConversations.filter((item) => item.id !== temporaryConversationId || temporaryConversationId !== 'new')
      );
      upsertConversation(conversation);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Unable to send message. Try again.'));
    } finally {
      setIsSending(false);
    }
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setDraftMessage('');
    setErrorMessage(emptyError);
    setRenamingConversationId(null);
  }

  function beginRename(conversation: ApiChatConversation) {
    setRenamingConversationId(conversation.id);
    setRenameTitle(conversation.title);
  }

  async function submitRename(conversationId: string) {
    const title = renameTitle.trim();

    if (!title) {
      setErrorMessage('Title is required.');
      return;
    }

    try {
      setErrorMessage(emptyError);
      const response = await api.patch<ApiEnvelope<{ conversation: ApiChatConversation }>>(`/chat/${conversationId}`, {
        title
      });
      upsertConversation(response.data.data.conversation);
      setRenamingConversationId(null);
      setRenameTitle('');
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Unable to rename conversation.'));
    }
  }

  async function deleteConversation(conversationId: string) {
    try {
      setErrorMessage(emptyError);
      await api.delete(`/chat/${conversationId}`);
      setConversations((currentConversations) => {
        const remaining = currentConversations.filter((conversation) => conversation.id !== conversationId);

        if (activeConversationId === conversationId) {
          setActiveConversationId(remaining[0]?.id ?? null);
        }

        return remaining;
      });
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error, 'Unable to delete conversation.'));
    }
  }

  return (
    <section className="h-[calc(100vh-3rem)] min-h-[720px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid h-full min-h-0 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-cyan-700">PrepAI</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">AI Chatbot</h1>
              </div>
              <button
                type="button"
                className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={handleNewChat}
              >
                New Chat
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {isLoadingHistory ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-500">
                Start a new chat to save your interview prep conversation history.
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  const isRenaming = conversation.id === renamingConversationId;

                  return (
                    <article
                      key={conversation.id}
                      className={`rounded-lg border p-3 transition ${
                        isActive ? 'border-cyan-200 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {isRenaming ? (
                        <div className="space-y-2">
                          <input
                            className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm font-medium text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            value={renameTitle}
                            onChange={(event) => setRenameTitle(event.target.value)}
                            maxLength={80}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white"
                              onClick={() => submitRename(conversation.id)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                              onClick={() => setRenamingConversationId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="block w-full text-left"
                            onClick={() => {
                              setActiveConversationId(conversation.id);
                              setErrorMessage(emptyError);
                            }}
                          >
                            <h2 className="truncate text-sm font-semibold text-slate-950">{conversation.title}</h2>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{getPreview(conversation)}</p>
                            <p className="mt-2 text-xs font-medium text-slate-400">{formatDate(conversation.updatedAt)}</p>
                          </button>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              onClick={() => beginRename(conversation)}
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                              onClick={() => deleteConversation(conversation.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-h-0 flex-col bg-white">
          <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-slate-950">{activeConversation?.title ?? 'New Chat'}</h2>
                <p className="text-sm text-slate-500">
                  {activeConversation
                    ? `${activeConversation.messages.length} messages · Updated ${formatDate(activeConversation.updatedAt)}`
                    : 'Ask about interview prep, DSA, SQL, aptitude, resumes, or mock interviews.'}
                </p>
              </div>
            </div>
            {errorMessage ? (
              <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {errorMessage}
              </div>
            ) : null}
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-6 sm:px-6">
            {activeConversation?.messages.length ? (
              <div className="mx-auto max-w-3xl space-y-5">
                {activeConversation.messages.map((message, index) => {
                  const isUser = message.role === 'user';
                  const messageKey = `${activeConversation.id}-${index}-${message.timestamp}`;

                  return (
                    <div key={messageKey} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <article
                        className={`max-w-[92%] rounded-lg border px-4 py-3 shadow-sm sm:max-w-[78%] ${
                          isUser
                            ? 'border-slate-900 bg-slate-950 text-white'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className={`mb-1 text-xs font-semibold ${isUser ? 'text-slate-300' : 'text-cyan-700'}`}>
                          {isUser ? 'You' : 'PrepAI'}
                        </div>
                        {isUser ? (
                          <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                        ) : (
                          <MessageContent content={message.content} messageKey={messageKey} />
                        )}
                      </article>
                    </div>
                  );
                })}
                {isSending ? <TypingIndicator /> : null}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="mx-auto flex h-full max-w-2xl items-center">
                <div className="w-full rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                  <p className="text-sm font-semibold uppercase text-cyan-700">AI Chat Assistant</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Start a focused prep conversation</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Ask for interview plans, concept explanations, coding approaches, SQL practice, resume feedback, or mock answer refinement.
                  </p>
                </div>
              </div>
            )}
          </div>

          <form className="border-t border-slate-200 bg-white p-4 sm:p-5" onSubmit={handleSubmit}>
            <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Message</span>
                <textarea
                  className="max-h-40 min-h-20 w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  placeholder="Ask PrepAI for interview help..."
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  disabled={isSending}
                  maxLength={8000}
                />
              </label>
              <button
                type="submit"
                className="rounded-md bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isSending || !draftMessage.trim()}
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
            <div className="mx-auto mt-2 flex max-w-3xl justify-end text-xs text-slate-500">{draftMessage.length}/8000</div>
          </form>
        </main>
      </div>
    </section>
  );
}
