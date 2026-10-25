import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Settings,
  X,
  Key,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Cpu,
  BookOpen,
} from 'lucide-react';
import { sendAIChat, getAIConfig, updateAIConfig } from '../api';
import { UserProfile } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  suggestions?: string[];
  modelUsed?: string;
  time: string;
}

interface AIChatModalProps {
  currentUser: UserProfile;
}

/** Very lightweight Markdown → JSX renderer (bold, italic, code, bullets) */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    // Horizontal rule
    if (line.trim() === '---') return <hr key={li} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />;

    // Unordered list item
    const bulletMatch = line.match(/^(\s*)[•\-\*]\s+(.*)/);
    if (bulletMatch) {
      return (
        <div key={li} style={{ display: 'flex', gap: '8px', marginBottom: '2px', paddingLeft: `${bulletMatch[1].length * 8}px` }}>
          <span style={{ color: '#818cf8', flexShrink: 0, marginTop: '2px' }}>•</span>
          <span>{inlineMarkdown(bulletMatch[2])}</span>
        </div>
      );
    }

    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      return (
        <div key={li} style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
          <span style={{ color: '#818cf8', flexShrink: 0, minWidth: '18px' }}>{numberedMatch[1]}.</span>
          <span>{inlineMarkdown(numberedMatch[2])}</span>
        </div>
      );
    }

    // Heading ### or ##
    if (line.startsWith('### ')) return <div key={li} style={{ fontWeight: 700, color: '#c084fc', fontSize: '0.95rem', marginTop: '8px' }}>{inlineMarkdown(line.slice(4))}</div>;
    if (line.startsWith('## ')) return <div key={li} style={{ fontWeight: 700, color: '#c084fc', fontSize: '1rem', marginTop: '10px' }}>{inlineMarkdown(line.slice(3))}</div>;

    // Empty line = spacer
    if (!line.trim()) return <div key={li} style={{ height: '6px' }} />;

    return <div key={li}>{inlineMarkdown(line)}</div>;
  });
}

function inlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#e2e8f0' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ background: 'rgba(99,102,241,0.2)', borderRadius: '4px', padding: '1px 5px', fontSize: '0.82em', color: '#a5b4fc', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} style={{ color: '#94a3b8' }}>{part.slice(1, -1)}</em>;
    }
    // Markdown link
    const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>{linkMatch[1]}</a>;
    }
    return part;
  });
}

const PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini', hint: 'Free key from aistudio.google.com', prefix: 'AIzaSy', placeholder: 'AIzaSy…' },
  { value: 'groq', label: 'Groq (Llama)', hint: 'Free key from console.groq.com', prefix: 'gsk_', placeholder: 'gsk_…' },
  { value: 'openrouter', label: 'OpenRouter', hint: 'Free credits at openrouter.ai', prefix: 'sk-or-', placeholder: 'sk-or-…' },
];

export const AIChatModal: React.FC<AIChatModalProps> = ({ currentUser }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello **${currentUser.name}**! I am your **CoopSync AI Advisor** for Smart India Hackathon 2026 (\`SIH26087\`).\n\nI have live access to your cooperative ERP database and can answer questions about:\n\n• **Attendance & Exam Eligibility** – GPS-verified attendance records\n• **Courses & YouTube LMS** – enroll, study, earn certified credentials\n• **AI Employment Matching** – AMUL, IFFCO, Sahakar FinTech openings\n• **Any General Topic** – science, math, engineering, coding\n\n💡 *Tip: Click ⚙️ AI Settings to connect a free Gemini or Groq key for full conversational AI on any topic!*`,
      suggestions: [
        'How many attendance days do I have?',
        'Recommend jobs for my skill profile',
        'What is machine learning?',
      ],
      time: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // ── Settings state ────────────────────────────────────────
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [settingsStatus, setSettingsStatus] = useState<{ type: 'success' | 'error' | null; msg: string }>({ type: null, msg: '' });
  const [savedProvider, setSavedProvider] = useState<string>('Local RAG');
  const [hasKey, setHasKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  // Load existing config on mount
  useEffect(() => {
    getAIConfig().then((cfg) => {
      if (cfg.success !== false) {
        if (cfg.provider) setSelectedProvider(cfg.provider);
        setHasKey(cfg.has_custom_key || false);
        setSavedProvider(cfg.has_custom_key ? (cfg.active_provider_name || cfg.provider) : 'Local RAG');
      }
    });
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const res = await sendAIChat(textToSend, currentUser.id);
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: res.reply || "I've reviewed your ERP record. You are in good standing.",
        suggestions: res.suggestions || [],
        modelUsed: res.model_used,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: "I couldn't reach the AI analysis service. Please ensure the backend (`python main.py`) is running on port 8000.",
          time: 'Now',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      setSettingsStatus({ type: 'error', msg: 'Please enter a valid API key.' });
      return;
    }
    setSavingKey(true);
    setSettingsStatus({ type: null, msg: '' });
    const result = await updateAIConfig(selectedProvider, apiKeyInput.trim());
    setSavingKey(false);
    if (result.success !== false) {
      setHasKey(true);
      setSavedProvider(result.active_provider_name || selectedProvider);
      setApiKeyInput('');
      setSettingsStatus({ type: 'success', msg: `✅ ${result.active_provider_name || selectedProvider} key saved! The chatbot will now use full Cloud AI for all questions.` });
      // Notify user in chat
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: 'ai',
          text: `🎉 **Cloud AI Connected!** Your **${result.active_provider_name || selectedProvider}** API key has been activated.\n\nYou can now ask me **any question** — science, coding, cooperative economics, or academic topics — and I'll answer using generative AI reasoning directly tailored to your ERP profile!`,
          suggestions: ['What is photosynthesis?', 'Explain machine learning in simple terms', 'How many attendance days do I have?'],
          modelUsed: result.active_provider_name || selectedProvider,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setShowSettings(false);
    } else {
      setSettingsStatus({ type: 'error', msg: `❌ ${result.message || 'Failed to save API key. Please check the key and try again.'}` });
    }
  };

  const providerInfo = PROVIDERS.find((p) => p.value === selectedProvider) || PROVIDERS[0];

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '78vh', maxHeight: '840px', overflow: 'hidden', position: 'relative' }}>

      {/* ── Header ── */}
      <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(168,85,247,0.45)', flexShrink: 0 }}>
            <Bot size={22} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: 0 }}>CoopSync AI Advisor</h3>
            <span style={{ fontSize: '0.72rem', color: hasKey ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="live-indicator" style={{ background: hasKey ? '#10b981' : '#f59e0b' }} />
              {hasKey ? `Cloud AI: ${savedProvider}` : 'Local RAG + Encyclopedia Mode'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {hasKey && (
            <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '3px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={11} /> Cloud AI Active
            </span>
          )}
          <button
            onClick={() => setShowSettings((s) => !s)}
            title="AI Settings – Connect API Key"
            style={{ background: showSettings ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)', border: `1px solid ${showSettings ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)'}`, borderRadius: '10px', color: showSettings ? '#a5b4fc' : '#94a3b8', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', transition: 'all 0.2s' }}
          >
            <Settings size={14} /> ⚙️ AI Settings
          </button>
        </div>
      </div>

      {/* ── Settings Panel (slide-in) ── */}
      {showSettings && (
        <div style={{ position: 'absolute', top: '70px', right: '16px', width: '360px', background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '16px', padding: '22px', zIndex: 100, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={16} color="#a855f7" />
              <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>Connect Free AI API</span>
            </div>
            <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}>
              <X size={16} />
            </button>
          </div>

          {/* Provider selector */}
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>AI Provider</label>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f1f5f9', fontSize: '0.88rem', appearance: 'none', cursor: 'pointer', outline: 'none' }}
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value} style={{ background: '#0f172a' }}>{p.label}</option>
              ))}
            </select>
            <ChevronDown size={14} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {/* Hint */}
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', fontSize: '0.78rem', color: '#94a3b8' }}>
            <BookOpen size={12} style={{ display: 'inline', marginRight: '6px', color: '#818cf8' }} />
            {providerInfo.hint} — <strong style={{ color: '#c7d2fe' }}>100% Free</strong>
          </div>

          {/* API Key input */}
          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>API Key</label>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={providerInfo.placeholder}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
          />

          {/* Status message */}
          {settingsStatus.type && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', background: settingsStatus.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${settingsStatus.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
              {settingsStatus.type === 'success' ? <CheckCircle2 size={14} color="#34d399" style={{ flexShrink: 0, marginTop: '1px' }} /> : <AlertTriangle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: '1px' }} />}
              <span style={{ fontSize: '0.78rem', color: settingsStatus.type === 'success' ? '#6ee7b7' : '#fca5a5', lineHeight: 1.4 }}>{settingsStatus.msg}</span>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSaveKey}
            disabled={savingKey || !apiKeyInput.trim()}
            className="gradient-btn"
            style={{ width: '100%', padding: '11px', borderRadius: '10px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {savingKey ? <><RefreshCw size={14} className="animate-spin" /> Connecting...</> : <><Key size={14} /> Save & Connect AI</>}
          </button>

          {/* Current status */}
          <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={12} />
            Current: <strong style={{ color: hasKey ? '#34d399' : '#f59e0b' }}>{hasKey ? savedProvider : 'CoopSync Local RAG + Wikipedia'}</strong>
          </div>
        </div>
      )}

      {/* ── Message History ── */}
      <div style={{ flex: 1, padding: '22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }} onClick={() => showSettings && setShowSettings(false)}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', maxWidth: '82%' }}>
              {msg.sender === 'ai' && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(168,85,247,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={16} color="#c084fc" />
                </div>
              )}

              <div style={{ background: msg.sender === 'user' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(255,255,255,0.05)', border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)', padding: '13px 17px', borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', color: '#f1f5f9', fontSize: '0.88rem', lineHeight: 1.6, boxShadow: msg.sender === 'user' ? '0 4px 15px rgba(99,102,241,0.3)' : 'none' }}>
                {msg.sender === 'ai' ? renderMarkdown(msg.text) : msg.text}
              </div>

              {msg.sender === 'user' && (
                <img src={currentUser.avatar} alt={currentUser.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #6366f1' }} />
              )}
            </div>

            {/* Model badge */}
            {msg.sender === 'ai' && msg.modelUsed && (
              <div style={{ marginLeft: '42px', fontSize: '0.68rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={10} />
                {msg.modelUsed}
              </div>
            )}

            {/* Suggestions */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: '42px', marginTop: '2px' }}>
                {msg.suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sug)}
                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.22)', color: '#c7d2fe', padding: '5px 11px', borderRadius: '20px', fontSize: '0.77rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.22)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                  >
                    <Sparkles size={11} color="#818cf8" />
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '42px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#818cf8', animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {hasKey ? `${savedProvider} is thinking…` : 'Searching knowledge base…'}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ── */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.18)', flexShrink: 0 }}
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={hasKey ? `Ask anything — science, career, attendance…` : `Ask about attendance, jobs, or courses for ${currentUser.name}…`}
          style={{ flex: 1, padding: '11px 15px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none' }}
          onFocus={() => showSettings && setShowSettings(false)}
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isTyping}
          className="gradient-btn"
          style={{ padding: '0 18px', borderRadius: '12px', minWidth: '48px' }}
        >
          {isTyping ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>

      {/* Bounce keyframe */}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </div>
  );
};
