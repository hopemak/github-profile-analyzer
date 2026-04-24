import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import API_URL from '../config';

const AIChat = () => {
  const { currentUsername } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!currentUsername) {
      alert('Please search for a GitHub profile first!');
      return;
    }
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/github/chat/${currentUsername}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });
      const data = await response.json();
      const aiMessage = { role: 'assistant', content: data.answer || 'Sorry, I could not answer that.' };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { role: 'assistant', content: 'Error connecting to AI. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full p-4 shadow-lg transition-all z-50"
      >
        {isOpen ? '✕' : '💬'}
      </button>
      
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl">
            <h3 className="font-bold">🤖 AI Assistant</h3>
            <p className="text-xs opacity-90">
              {currentUsername ? `Chatting about ${currentUsername}` : 'Search a profile first'}
            </p>
          </div>
          
          <div className="h-96 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
                <p>💡 Example questions:</p>
                <p className="mt-2">• What are their strengths?</p>
                <p>• How can they improve their code?</p>
                <p>• Which technologies should they learn?</p>
                {!currentUsername && <p className="mt-4 text-yellow-500">⚠️ Search for a GitHub profile first!</p>}
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentUsername ? "Ask a question..." : "Search a profile first"}
                disabled={loading || !currentUsername}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim() || !currentUsername}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
