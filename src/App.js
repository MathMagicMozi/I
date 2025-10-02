import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import axios from 'axios';

// 设置API基础URL
const API_BASE_URL = 'http://localhost:8000/api/documents';

function App() {
  // 标签页状态
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 自动保存相关状态
  const [dirtyTabs, setDirtyTabs] = useState(new Set()); // 记录被编辑过的标签页
  
  // 聊天状态
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: '您好！我是您的AI助手。您可以在左侧编辑Markdown文档，然后在这里与我讨论您的内容。',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 目录结构状态
  const [directoryStructure, setDirectoryStructure] = useState([
    {
      id: 'folder1',
      name: '笔记信息',
      type: 'folder',
      expanded: true,
      children: []
    }
  ]);

  // 引用元素
  const tabsContainerRef = useRef(null);
  const directoryContentRef = useRef(null);
  const activeTabRef = useRef(null);
  const activeDirectoryItemRef = useRef(null);
  const chatMessagesRef = useRef(null);
  
  // 自动保存定时器引用
  const saveIntervalRef = useRef(null);
  const idleTimerRef = useRef(null);

  // 当前活动标签页
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // 组件加载时从后端获取文档数据
  useEffect(() => {
    fetchDocuments();
  }, []);

  // 设置自动保存定时器
  useEffect(() => {
    // 设置5秒间隔自动保存
    saveIntervalRef.current = setInterval(async () => {
      // 保存所有标记为"脏"的标签页
      for (const tabId of dirtyTabs) {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
          await saveDocument(tab.id, tab.title, tab.content);
          // 保存成功后从dirtyTabs中移除
          setDirtyTabs(prev => {
            const newDirtyTabs = new Set(prev);
            newDirtyTabs.delete(tabId);
            return newDirtyTabs;
          });
        }
      }
    }, 5000); // 5秒

    // 清理定时器
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [tabs, dirtyTabs]);

  // 从后端获取所有文档
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_BASE_URL);
      const documents = response.data;
      
      if (documents.length > 0) {
        // 将文档转换为标签页格式
        const newTabs = documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          content: doc.content
        }));
        
        setTabs(newTabs);
        setActiveTabId(documents[0].id);
        
        // 构建目录结构
        const fileItems = documents.map(doc => ({
          id: doc.id,
          name: doc.title,
          type: 'file'
        }));
        
        setDirectoryStructure([
          {
            id: 'folder1',
            name: '笔记信息',
            type: 'folder',
            expanded: true,
            children: fileItems
          }
        ]);
      } else {
        // 如果没有文档，创建一个默认文档
        createDefaultDocument();
      }
    } catch (error) {
      console.error('获取文档失败:', error);
      // 如果获取失败，创建一个默认文档
      createDefaultDocument();
    } finally {
      setIsLoading(false);
    }
  };

  // 创建默认文档
  const createDefaultDocument = async () => {
    try {
      const newDocument = {
        title: '新建文档1.md',
        content: '# 新建文档\n\n在这里输入您的内容...'
      };
      
      const response = await axios.post(API_BASE_URL, newDocument);
      const createdDocument = response.data;
      
      const newTab = {
        id: createdDocument.id,
        title: createdDocument.title,
        content: createdDocument.content
      };
      
      setTabs([newTab]);
      setActiveTabId(createdDocument.id);
      
      // 更新目录结构
      setDirectoryStructure([
        {
          id: 'folder1',
          name: '笔记信息',
          type: 'folder',
          expanded: true,
          children: [
            {
              id: createdDocument.id,
              name: createdDocument.title,
              type: 'file'
            }
          ]
        }
      ]);
    } catch (error) {
      console.error('创建默认文档失败:', error);
      // 如果后端创建失败，使用本地默认文档
      const defaultTab = {
        id: 1,
        title: '新建文档1.md',
        content: '# 新建文档\n\n在这里输入您的内容...'
      };
      
      setTabs([defaultTab]);
      setActiveTabId(1);
    }
  };

  // 保存文档到后端
  const saveDocument = async (docId, title, content) => {
    try {
      await axios.put(`${API_BASE_URL}/${docId}`, {
        title: title,
        content: content
      });
      console.log(`文档 ${docId} 保存成功`);
    } catch (error) {
      console.error(`保存文档 ${docId} 失败:`, error);
    }
  };

  // 切换标签页
  const handleTabClick = (tabId) => {
    setActiveTabId(tabId);
  };

  // 添加新标签页
  const handleAddTab = async () => {
    try {
      // 防止重复点击创建多个文档
      if (handleAddTab.creating) return;
      handleAddTab.creating = true;
      
      // 创建新文档
      const maxId = Math.max(...tabs.map(t => typeof t.id === 'number' ? t.id : 0), 0);
      const newTitle = `新建文档${maxId + 1}.md`;
      
      const newDocument = {
        title: newTitle,
        content: '# 新建文档\n\n在这里输入您的内容...'
      };
      
      const response = await axios.post(API_BASE_URL, newDocument);
      const createdDocument = response.data;
      
      // 检查是否已经存在相同ID的标签
      if (!tabs.find(tab => tab.id === createdDocument.id)) {
        const newTab = {
          id: createdDocument.id,
          title: createdDocument.title,
          content: createdDocument.content
        };
        
        setTabs(prevTabs => [...prevTabs, newTab]);
        setActiveTabId(createdDocument.id);
        
        // 更新目录结构
        const newFile = {
          id: createdDocument.id,
          name: createdDocument.title,
          type: 'file'
        };
        
        setDirectoryStructure(prev => {
          const newStructure = [...prev];
          const folder = newStructure.find(item => item.id === 'folder1');
          if (folder) {
            // 检查是否已经存在相同ID的文件
            if (!folder.children.find(child => child.id === createdDocument.id)) {
              folder.children = [...folder.children, newFile];
            }
          }
          return newStructure;
        });
      }
    } catch (error) {
      console.error('创建新文档失败:', error);
    } finally {
      handleAddTab.creating = false;
    }
  };

  // 关闭标签页
  const handleCloseTab = async (e, tabId) => {
    e.stopPropagation();
    if (tabs.length <= 1) return; // 至少保留一个标签页
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    // 如果关闭的是当前活动标签页，切换到第一个标签页
    if (tabId === activeTabId) {
      setActiveTabId(newTabs[0].id);
    }
    
    // 注意：这里不再从后端删除文档，只是关闭标签页
    // 目录结构保持不变，文档仍然存在于后端
  };

  // 更新文档内容
  const handleContentChange = (e) => {
    const updatedTabs = tabs.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, content: e.target.value } 
        : tab
    );
    setTabs(updatedTabs);
    
    // 将当前标签页标记为"脏"（需要保存）
    setDirtyTabs(prev => {
      const newDirtyTabs = new Set(prev);
      newDirtyTabs.add(activeTabId);
      return newDirtyTabs;
    });
    
    // 重置空闲定时器（防抖）
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    // 设置2秒空闲保存（用户停止输入2秒后自动保存）
    idleTimerRef.current = setTimeout(async () => {
      const tab = tabs.find(t => t.id === activeTabId);
      if (tab) {
        await saveDocument(tab.id, tab.title, tab.content);
        // 保存成功后从dirtyTabs中移除
        setDirtyTabs(prev => {
          const newDirtyTabs = new Set(prev);
          newDirtyTabs.delete(activeTabId);
          return newDirtyTabs;
        });
      }
    }, 2000); // 2秒空闲
  };

  // 保存文档（Cmd+S）
  const handleSaveDocument = async () => {
    if (activeTab) {
      await saveDocument(activeTab.id, activeTab.title, activeTab.content);
    }
  };

  // 发送聊天消息
  const sendChatMessage = async () => {
    if (!chatInput.trim() || isSending) return;
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };
    
    // 添加用户消息到聊天记录
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput('');
    setIsSending(true);
    
    try {
      // 准备发送给后端的消息格式
      const messages = newMessages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        }));
      
      // 发送消息到后端
      const response = await axios.post('http://localhost:8000/api/chat/message', {
        messages: messages,
        document_id: activeTabId // 将当前活动文档ID发送给后端
      });
      
      // 添加AI响应到聊天记录
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.message.content,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
      // 添加错误消息到聊天记录
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '抱歉，发送消息失败，请稍后再试。',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 保存文档快捷键 (Cmd+S 或 Ctrl+S)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDocument();
      }
      
      // 发送聊天消息快捷键 (Enter)
      if (e.key === 'Enter' && !e.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('chat-input')) {
          e.preventDefault();
          sendChatMessage();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, chatInput, isSending]);

  // 切换文件夹展开/收起状态
  const toggleFolder = (folderId) => {
    const updateFolderExpanded = (items) => {
      return items.map(item => {
        if (item.type === 'folder' && item.id === folderId) {
          return { ...item, expanded: !item.expanded };
        } else if (item.type === 'folder' && item.children) {
          return { ...item, children: updateFolderExpanded(item.children) };
        }
        return item;
      });
    };
    
    setDirectoryStructure(updateFolderExpanded(directoryStructure));
  };

  // 添加新文件夹
  const addNewFolder = () => {
    const newFolder = {
      id: `folder${Date.now()}`,
      name: '新建文件夹',
      type: 'folder',
      expanded: true,
      children: []
    };
    
    setDirectoryStructure([newFolder, ...directoryStructure]);
  };

  // 添加新文件
  const addNewFile = async () => {
    try {
      // 防止重复点击创建多个文档
      if (addNewFile.creating) return;
      addNewFile.creating = true;
      
      // 找到最大的数字ID
      const maxId = Math.max(...tabs.map(t => typeof t.id === 'number' ? t.id : 0), 0);
      const newTitle = `新建文档${maxId + 1}.md`;
      
      const newDocument = {
        title: newTitle,
        content: '# 新建文档\n\n在这里输入您的内容...'
      };
      
      const response = await axios.post(API_BASE_URL, newDocument);
      const createdDocument = response.data;
      
      // 检查是否已经存在相同ID的标签
      if (!tabs.find(tab => tab.id === createdDocument.id)) {
        const newFile = {
          id: createdDocument.id,
          name: createdDocument.title,
          type: 'file'
        };
        
        // 创建对应的新标签页
        const newTab = {
          id: createdDocument.id,
          title: createdDocument.title,
          content: createdDocument.content
        };
        
        setTabs(prevTabs => [...prevTabs, newTab]);
        setActiveTabId(createdDocument.id); // 选中新建的文档
        
        // 将新文件添加到笔记信息文件夹
        setDirectoryStructure(prev => {
          const newStructure = [...prev];
          const folder = newStructure.find(item => item.id === 'folder1');
          if (folder) {
            // 检查是否已经存在相同ID的文件
            if (!folder.children.find(child => child.id === createdDocument.id)) {
              folder.children = [...folder.children, newFile];
            }
          }
          return newStructure;
        });
      }
    } catch (error) {
      console.error('创建新文件失败:', error);
    } finally {
      addNewFile.creating = false;
    }
  };

  // 从目录区选择文件
  const handleFileSelect = (fileId) => {
    // 检查该文件是否已经存在于标签页中
    const existingTab = tabs.find(tab => tab.id === fileId);
    
    if (existingTab) {
      // 如果文件已存在，直接选中
      setActiveTabId(fileId);
    } else {
      // 如果文件不存在于标签页中，在标签页末尾追加新标签
      // 首先在目录结构中找到该文件
      const findFileInDirectory = (items) => {
        for (const item of items) {
          if (item.type === 'file' && item.id === fileId) {
            return item;
          } else if (item.type === 'folder' && item.children) {
            const found = findFileInDirectory(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const file = findFileInDirectory(directoryStructure);
      if (file) {
        // 从后端获取文档内容
        axios.get(`${API_BASE_URL}/${fileId}`)
          .then(response => {
            const document = response.data;
            // 创建新的标签页并追加到末尾
            const newTab = {
              id: document.id,
              title: document.title,
              content: document.content
            };
            
            setTabs([...tabs, newTab]);
            setActiveTabId(document.id);
          })
          .catch(error => {
            console.error('获取文档内容失败:', error);
            // 如果获取失败，使用默认内容
            const newTab = {
              id: fileId,
              title: file.name,
              content: '# ' + file.name.replace('.md', '') + '\n\n在这里输入您的内容...'
            };
            
            setTabs([...tabs, newTab]);
            setActiveTabId(fileId);
          });
      }
    }
  };

  // 当活动标签页改变时，滚动到可见位置
  useEffect(() => {
    // 滚动标签页到可见位置
    if (tabsContainerRef.current) {
      // 找到活动标签页的DOM元素
      const activeTabElement = document.querySelector('.tab.active');
      if (activeTabElement) {
        const container = tabsContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const activeTabRect = activeTabElement.getBoundingClientRect();
        
        // 如果活动标签页不在可见区域内，则滚动到可见位置
        if (activeTabRect.left < containerRect.left) {
          container.scrollLeft += activeTabRect.left - containerRect.left - 10;
        } else if (activeTabRect.right > containerRect.right) {
          container.scrollLeft += activeTabRect.right - containerRect.right + 10;
        }
      }
    }
    
    // 滚动目录项到可见位置
    if (activeDirectoryItemRef.current && directoryContentRef.current) {
      const container = directoryContentRef.current;
      const activeItem = activeDirectoryItemRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const activeItemRect = activeItem.getBoundingClientRect();
      
      // 如果活动目录项不在可见区域内，则滚动到可见位置
      if (activeItemRect.top < containerRect.top) {
        container.scrollTop += activeItemRect.top - containerRect.top - 10;
      } else if (activeItemRect.bottom > containerRect.bottom) {
        container.scrollTop += activeItemRect.bottom - containerRect.bottom + 10;
      }
    }
  }, [activeTabId]);
  
  // 当聊天消息更新时，滚动到底部
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 渲染目录项
  const renderDirectoryItem = (item, level = 0) => {
    const indent = { paddingLeft: `${level * 20 + 10}px` };
    
    if (item.type === 'folder') {
      return (
        <div key={item.id}>
          <div 
            className="directory-item folder"
            style={indent}
          >
            <span 
              className="folder-toggle"
              onClick={() => toggleFolder(item.id)}
            >
              {item.expanded ? '▼' : '▶'}
            </span>
            <span className="folder-icon">📁</span>
            <span className="folder-name">{item.name}</span>
          </div>
          {item.expanded && item.children && (
            <div className="folder-children">
              {item.children.map(child => renderDirectoryItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div 
          ref={activeTabId === item.id ? activeDirectoryItemRef : null}
          key={item.id}
          className={`directory-item file ${activeTabId === item.id ? 'active' : ''}`}
          style={indent}
          onClick={() => handleFileSelect(item.id)}
        >
          <span className="file-icon">📄</span>
          <span className="file-name">{item.name}</span>
        </div>
      );
    }
  };

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <p>正在加载文档...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="app-container">
        <div className="editor-container">
          <div className="tabs-container" ref={tabsContainerRef}>
            <div className="tabs">
              {tabs.map(tab => (
                <div 
                  ref={tab.id === activeTabId ? activeTabRef : null}
                  key={tab.id}
                  className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <span className="tab-title">{tab.title}</span>
                  <span 
                    className="tab-close"
                    onClick={(e) => handleCloseTab(e, tab.id)}
                  >
                    ×
                  </span>
                </div>
              ))}
              <button className="add-tab-button" onClick={handleAddTab}>+</button>
            </div>
          </div>
          <div className="editor-content">
            <textarea 
              className="document-editor markdown-editor"
              placeholder="在此处输入Markdown格式的文档内容..."
              value={activeTab ? activeTab.content : ''}
              onChange={handleContentChange}
            />
          </div>
        </div>
        <div className="right-panel">
          <div className="directory-container">
            <div className="directory-header">
              <h2>资源管理器</h2>
              <div className="directory-actions">
                <button className="add-folder-btn" onClick={addNewFolder}>📁</button>
                <button className="add-file-btn" onClick={addNewFile}>📄</button>
              </div>
            </div>
            <div className="directory-content" ref={directoryContentRef}>
              {directoryStructure.map(item => renderDirectoryItem(item))}
            </div>
          </div>
          <div className="chat-container">
            <div className="chat-header">
              <h2>AI 助手</h2>
            </div>
            <div className="chat-messages" ref={chatMessagesRef}>
              {chatMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message ${message.role === 'user' ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-input-container">
              <textarea 
                className="chat-input"
                placeholder="输入消息..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isSending}
              />
              <button 
                className="send-button" 
                onClick={sendChatMessage}
                disabled={isSending || !chatInput.trim()}
              >
                {isSending ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
