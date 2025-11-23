import React, { useState, useEffect } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Loader2 } from 'lucide-react';
// 注意：这里引入了 sendMessage，确保上面的 mockDatabase.ts 文件已更新
import { getMyThreads, getThreadMessages, sendMessage } from '../services/mockDatabase';
import { ChatThread, ChatMessage } from '../types';

const Messages: React.FC = () => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);

  // 初始化：加载左侧聊天列表
  useEffect(() => {
    getMyThreads().then(t => {
      setThreads(t);
      if (t.length > 0) setActiveThreadId(t[0].id);
      setLoading(false);
    });
  }, []);

  // 当选中的聊天变化时，加载右侧消息记录
  useEffect(() => {
    if (activeThreadId) {
      getThreadMessages(activeThreadId).then(setMessages);
    }
  }, [activeThreadId]);

  // ▼▼▼ 新增的核心功能：处理发送消息 ▼▼▼
  const handleSendMessage = async () => {
    // 如果输入为空，或者没有选中的聊天，直接返回
    if (!inputValue.trim() || !activeThreadId) return;

    try {
      // 1. 调用 API 发送消息 (这一步会存入数据库)
      await sendMessage(activeThreadId, inputValue);
      
      // 2. 清空输入框
      setInputValue('');
      
      // 3. 重新获取当前聊天的最新消息 (这样你就能看到自己刚发的消息了)
      const updatedMessages = await getThreadMessages(activeThreadId);
      setMessages(updatedMessages);
      
      // 4. (可选) 重新获取左侧列表，为了更新“最后一条消息”的时间和预览
      const updatedThreads = await getMyThreads();
      setThreads(updatedThreads);
      
    } catch (error) {
      console.error("Failed to send message", error);
      // 如果后端没开，或者数据库报错，这里会弹窗提示
      alert("发送失败，请确保后端服务已启动！");
    }
  };
  // ▲▲▲ 新增结束 ▲▲▲

  const activeThread = threads.find(t => t.id === activeThreadId);
  const colors = ['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-[calc(100vh-140px)] flex overflow-hidden">
      {/* Chat List */}
      <div className="w-full md:w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search conversations..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {threads.map((thread, index) => (
                <div 
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`p-4 flex items-start space-x-3 cursor-pointer transition-colors ${activeThreadId === thread.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                    <div className={`w-10 h-10 ${colors[index % colors.length]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                        {thread.partnerName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">{thread.partnerName}</h4>
                            <span className="text-xs text-gray-400">{thread.lastMessageTime}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-1">{thread.taskTitle}</p>
                        <p className="text-sm text-gray-600 truncate">{thread.lastMessage}</p>
                    </div>
                    {thread.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-2">
                            {thread.unreadCount}
                        </div>
                    )}
                </div>
            ))}
            {threads.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">No messages yet</div>
            )}
        </div>
      </div>

      {/* Active Chat */}
      {activeThread ? (
          <div className="hidden md:flex flex-1 flex-col bg-gray-50/50">
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {activeThread.partnerName.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{activeThread.partnerName}</h3>
                        <p className="text-xs text-gray-500">{activeThread.taskTitle}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4 text-gray-500">
                    <Phone size={20} className="hover:text-gray-800 cursor-pointer" />
                    <Video size={20} className="hover:text-gray-800 cursor-pointer" />
                    <MoreVertical size={20} className="hover:text-gray-800 cursor-pointer" />
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            msg.isMe
                                ? 'bg-blue-500 text-white rounded-br-none' 
                                : 'bg-white border border-gray-100 shadow-sm rounded-bl-none'
                        }`}>
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-[10px] mt-1 text-right ${msg.isMe ? 'text-blue-100' : 'text-gray-400'}`}>{msg.timestamp}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-end space-x-2 bg-white border border-gray-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-500 ring-offset-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Paperclip size={20} />
                    </button>
                    <textarea 
                        className="flex-1 max-h-32 py-2 bg-transparent border-none focus:ring-0 resize-none text-sm scrollbar-hide"
                        placeholder="Type your message..."
                        rows={1}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        // ▼▼▼ 修改了这里：绑定回车发送事件 ▼▼▼
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(); // 按回车发送
                            }
                        }}
                    />
                    {/* ▼▼▼ 修改了这里：绑定点击发送事件 ▼▼▼ */}
                    <button 
                        onClick={handleSendMessage}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-xs text-gray-400">Press Enter to send, Shift+Enter for new line</p>
                </div>
            </div>
          </div>
      ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
              <p className="text-gray-400">Select a conversation to start messaging</p>
          </div>
      )}
    </div>
  );
};

export default Messages;