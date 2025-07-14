import React, { useState, useRef, useEffect } from 'react';
import {
  SendIcon,
  UserIcon,
  LoaderIcon,
  SparklesIcon,
  ExternalLinkIcon,
  CalendarIcon,
  GlobeIcon,
  ShieldIcon,
  LightbulbIcon,
  TrendingUpIcon,
  AlertTriangleIcon
} from 'lucide-react';
import { ButtonColorful } from '@/components/ui/button-colorful';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: ChatSource[];
  isLoading?: boolean;
  isStreaming?: boolean;
}

interface ChatSource {
  id: number;
  title: string;
  source: string;
  published_date: string;
  similarity: string;
  url?: string;
  snippet: string;
}

interface SampleQuestion {
  icon: React.ReactNode;
  text: string;
  category: string;
}

interface FormattedMessageProps {
  content: string;
  isStreaming?: boolean;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, isStreaming }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasBeenStreamed, setHasBeenStreamed] = useState(false);

  useEffect(() => {
    if (isStreaming) {
      // Mark that this content has been streamed
      setHasBeenStreamed(true);
      // Show content immediately when streaming
      setDisplayedContent(content);
      setIsTyping(false);
      return;
    }

    if (!content) {
      setDisplayedContent('');
      setHasBeenStreamed(false);
      return;
    }

    // Skip typing animation if content was already streamed
    if (hasBeenStreamed) {
      setDisplayedContent(content);
      setIsTyping(false);
      return;
    }

    // Start typing animation only for non-streamed messages
    setIsTyping(true);
    setDisplayedContent('');
    
    let index = 0;
    const typingSpeed = 5; // Faster typing for better UX
    
    const timer = setInterval(() => {
      setDisplayedContent(content.slice(0, index + 1));
      index++;
      
      if (index >= content.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, typingSpeed);

    return () => clearInterval(timer);
  }, [content, isStreaming, hasBeenStreamed]);

  const formatContent = (text: string) => {
    if (!text) return '';
    
    // Clean up the text and format it properly
    let formatted = text;
    
    // Remove excessive asterisks and format bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
    
    // Format section headers that start with numbers and asterisks
    formatted = formatted.replace(/(\d+)\.\s*\*\*(.*?)\*\*/g, '<div class="mb-4 mt-4"><span class="font-bold text-blue-300 text-lg">$1. $2</span></div>');
    
    // Format regular numbered lists
    formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="mb-3 ml-4 flex items-start"><span class="font-semibold text-blue-300 mr-2 min-w-[1.5rem]">$1.</span><span class="flex-1">$2</span></div>');
    
    // Format bullet points
    formatted = formatted.replace(/^[-•]\s+(.+)$/gm, '<div class="mb-2 ml-6 flex items-start"><span class="text-blue-300 mr-2 mt-1">•</span><span class="flex-1">$1</span></div>');
    
    // Format section headers (lines that end with colon and aren't part of numbered lists)
    formatted = formatted.replace(/^([^0-9].+):$/gm, '<h4 class="font-bold text-white mt-6 mb-3 text-lg border-b border-gray-600 pb-2">$1</h4>');
    
    // Format sub-headers (lines in all caps)
    formatted = formatted.replace(/^([A-Z\s]{3,}):$/gm, '<h5 class="font-semibold text-blue-200 mt-4 mb-2">$1</h5>');
    
    // Clean up multiple newlines
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    // Convert single newlines to breaks but preserve paragraph spacing
    formatted = formatted.replace(/\n\n/g, '|||PARAGRAPH|||');
    formatted = formatted.replace(/\n/g, '<br/>');
    formatted = formatted.replace(/\|\|\|PARAGRAPH\|\|\|/g, '</p><p class="mt-4">');
    
    // Wrap everything in a paragraph
    if (formatted && !formatted.startsWith('<')) {
      formatted = '<p>' + formatted + '</p>';
    }
    
    return formatted;
  };

  const currentContent = displayedContent;
  const formattedContent = formatContent(currentContent);

  return (
    <div className="space-y-2">
      <div 
        className="leading-relaxed text-gray-100"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
      {(isStreaming || isTyping) && (
        <span className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse ml-1 mt-1"></span>
      )}
    </div>
  );
};

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sampleQuestions: SampleQuestion[] = [
    {
      icon: <ShieldIcon size={16} className="text-blue-400" />,
      text: "What are the latest ransomware attack trends?",
      category: "Threat Intelligence"
    },
    {
      icon: <AlertTriangleIcon size={16} className="text-red-400" />,
      text: "How do threat actors typically gain initial access?",
      category: "Attack Vectors"
    },
    {
      icon: <TrendingUpIcon size={16} className="text-green-400" />,
      text: "What vulnerabilities are being actively exploited?",
      category: "Vulnerabilities"
    },
    {
      icon: <GlobeIcon size={16} className="text-purple-400" />,
      text: "Which countries are most targeted by cyber attacks?",
      category: "Geopolitics"
    },
    {
      icon: <LightbulbIcon size={16} className="text-yellow-400" />,
      text: "What are effective defense strategies against APT groups?",
      category: "Defense"
    },
    {
      icon: <SparklesIcon size={16} className="text-cyan-400" />,
      text: "How has the threat landscape evolved recently?",
      category: "Trends"
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSampleQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('🔄 Starting streaming chat request...');
      
      // Use fetch with ReadableStream for POST streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          message: userMessage.content,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let sources: ChatSource[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'sources') {
                sources = data.sources;
                console.log('📚 Received sources:', sources.length);
                
                // Update message with sources immediately
                setMessages(prev => prev.map(msg => 
                  msg.id === loadingMessage.id ? {
                    ...msg,
                    isLoading: false,
                    isStreaming: true,
                    sources: sources
                  } : msg
                ));
              } else if (data.type === 'content') {
                accumulatedContent += data.content;
                
                // Update message with streaming content immediately
                setMessages(prev => prev.map(msg => 
                  msg.id === loadingMessage.id ? {
                    ...msg,
                    content: accumulatedContent,
                    isLoading: false,
                    isStreaming: true,
                    sources: sources
                  } : msg
                ));
              } else if (data.type === 'done') {
                console.log('✅ Streaming completed');
                setIsLoading(false);
                break;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError);
            }
          }
        }
      }

             // Final update to ensure completion
       setMessages(prev => prev.map(msg => 
         msg.id === loadingMessage.id ? {
           ...msg,
           content: accumulatedContent,
           isLoading: false,
           isStreaming: false,
           sources: sources
         } : msg
       ));

    } catch (error) {
      console.error('Chat streaming error:', error);
      
      const errorMessage: ChatMessage = {
        id: loadingMessage.id,
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your question. Please try again or check if the service is available.',
        timestamp: new Date(),
        isLoading: false
      };

      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id ? errorMessage : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
              <div className="bg-gray-800/50 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-2xl font-bold">Cyber Intelligence Chat</h1>
              <p className="text-gray-400">Ask me anything about cybersecurity threats and intelligence</p>
            </div>
          </div>
        </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <img src="/ai.svg" alt="AI" className="w-8 h-8" />
            </div>
                          <h2 className="text-xl font-semibold mb-2">Welcome to Cyber Intelligence Chat</h2>

              
              {/* Sample Questions */}
            <div className="w-full max-w-4xl">
              <h3 className="text-lg font-medium mb-4 text-center">Try asking about:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSampleQuestion(question.text)}
                    className="p-4 bg-gray-800/40 hover:bg-gray-800/60 border border-white/10 hover:border-white/20 rounded-xl transition-all group text-left"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {question.icon}
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {question.category}
                      </span>
                    </div>
                    <p className="text-sm group-hover:text-white transition-colors">
                      {question.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex items-start space-x-3 ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-blue-600' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}>
                {message.type === 'user' ? (
                  <UserIcon size={16} className="text-white" />
                ) : (
                  <img src="/ai.svg" alt="AI" className="w-4 h-4" />
                )}
              </div>

              {/* Message Content */}
              <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-4 rounded-2xl max-w-3xl ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/50 border border-white/10'
                }`}>
                  {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <LoaderIcon size={16} className="animate-spin" />
                      <span className="text-gray-400">Searching through intelligence database...</span>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <FormattedMessage content={message.content} isStreaming={message.isStreaming} />
                    </div>
                  )}
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-400 flex items-center">
                      <ExternalLinkIcon size={14} className="mr-2" />
                      Sources from Intelligence Database ({message.sources.length})
                    </h4>
                    <div className="space-y-2">
                      {message.sources.map((source, index) => (
                        <div key={index} className="bg-gray-800/30 border border-white/5 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm mb-1 line-clamp-2">{source.title}</h5>
                              <div className="flex items-center space-x-4 text-xs text-gray-400 mb-2">
                                <div className="flex items-center space-x-1">
                                  <GlobeIcon size={12} />
                                  <span>{source.source}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <CalendarIcon size={12} />
                                  <span>{new Date(source.published_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <SparklesIcon size={12} />
                                  <span>{(parseFloat(source.similarity) * 100).toFixed(1)}% relevant</span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-300 line-clamp-2">{source.snippet}</p>
                            </div>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-3 p-1 hover:bg-white/10 rounded-md transition-colors"
                                title="Open source article"
                              >
                                <ExternalLinkIcon size={14} className="text-gray-400 hover:text-white" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className={`text-xs text-gray-500 mt-2 ${
                  message.type === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {formatDate(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-800/30 backdrop-blur-xl border-t border-white/10 p-6">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about cybersecurity threats, vulnerabilities, attack trends..."
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-700/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 disabled:opacity-50"
            />
          </div>
          {isLoading ? (
            <div className="flex items-center space-x-2 px-6 py-3">
              <LoaderIcon size={18} className="animate-spin text-white" />
              <span className="hidden sm:block text-white font-medium">Send</span>
            </div>
          ) : (
            <ButtonColorful
              type="submit"
              disabled={!input.trim()}
              label="Send"
              className="px-6 py-3"
            />
          )}
        </form>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          Powered by AI and our cybersecurity intelligence database
        </div>
      </div>
    </div>
  );
}; 