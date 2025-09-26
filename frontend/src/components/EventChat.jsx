// EventChat.jsx - Modern Real-time Chat Component
// Enhanced with typing indicators, reactions, file sharing, and modern UX

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  FaPaperPlane, 
  FaSmile, 
  FaImage, 
  FaReply, 
  FaEdit, 
  FaTrash, 
  FaThumbsUp, 
  FaLaugh, 
  FaAngry, 
  FaFile, 
  FaDownload, 
  FaTimes,
  FaEllipsisV,
  FaCopy,
  FaVolumeUp,
  FaVolumeMute,
  FaSearch,
  FaFilter,
  FaClock,
  FaUser,
  FaCheck,
  FaCheckDouble,
  FaExclamationTriangle,
  FaSpinner,
  FaPlus,
  FaMinus,
  FaEye,
  FaEyeSlash,
  FaRedoAlt
} from 'react-icons/fa';
import { getEventChatMessages, sendEventChatMessage, sendEventChatMessageWithFiles, getEventChatParticipants, getEventParticipantsPublic, addEventChatReaction, deleteEventChatMessage, editEventChatMessage } from '../api/api';
import { API_URL } from '../config/environment';
import './EventChat.css';

const EventChat = ({ 
  eventId, 
  eventTitle, 
  onClose, 
  viewProfile, 
  isFullscreen = false, 
  notificationsEnabled = true 
}) => {
  // Core state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  // UI state
  const [participants, setParticipants] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState(null);
  
  // File handling
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Typing indicators
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  
  // Message status
  const [messageStatus, setMessageStatus] = useState({});
  
  // Track failed images
  const [failedImages, setFailedImages] = useState(new Set());
  
  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const fileInputRef = useRef(null);
  
  // User data
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Helper function to construct full URL for attachments
  const getAttachmentUrl = useCallback((url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // If URL already starts with /api, don't prepend API_URL again
    if (url.startsWith('/api')) {
      return `${API_URL.replace('/api', '')}${url}`;
    }
    return `${API_URL}${url}`;
  }, []);

  // Enhanced image URL helper with fallback
  const getImageUrlWithFallback = useCallback((url, fallbackUrl = '/logo.png') => {
    if (!url) return fallbackUrl;
    
    try {
      const fullUrl = getAttachmentUrl(url);
      return fullUrl;
    } catch (error) {
      console.warn('Error constructing image URL:', error);
      return fallbackUrl;
    }
  }, [getAttachmentUrl]);

  // Enhanced download function with better error handling and progress indication
  const downloadFile = useCallback(async (attachment) => {
    try {
      const fileUrl = getAttachmentUrl(attachment.url);
      const fileName = attachment.originalName || `attachment_${Date.now()}`;
      
      // Check if the file exists first
      const response = await fetch(fileUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`File not found: ${response.status}`);
      }
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      console.log(`Download started: ${fileName}`);
      
    } catch (error) {
      console.error('Download failed:', error);
      if (error.message.includes('not found')) {
        alert(`File "${attachment.originalName || 'attachment'}" is not available for download. It may have been deleted from the server.`);
      } else {
        alert(`Failed to download ${attachment.originalName || 'file'}. Please try again.`);
      }
    }
  }, [getAttachmentUrl]);

  // Helper function to check if file exists before loading
  const checkFileExists = useCallback(async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn('File check failed:', url, error);
      return false;
    }
  }, []);

  // Enhanced utility functions
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const formatTime = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString();
    }
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getFileIcon = useCallback((file) => {
    if (file.type.startsWith('image/')) {
      return <FaImage className="file-icon image" />;
    } else if (file.type.startsWith('video/')) {
      return <FaFile className="file-icon video" />;
    }
    return <FaFile className="file-icon" />;
  }, []);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show success notification
      console.log('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }, []);


  // Typing indicator handlers
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // Send typing indicator to server
      // This would be implemented with WebSocket or similar
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  }, [isTyping]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load messages with retry logic and smart loading states
  const loadMessages = useCallback(async (retryCount = 0, isBackgroundRefresh = false) => {
    try {
      // Only show loading spinner on initial load or manual refresh
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      
      const data = await getEventChatMessages(eventId);
      const newMessages = data.messages || [];
      
      // Check if we have new messages
      const hasNewMessages = newMessages.length > lastMessageCount;
      
      setMessages(newMessages);
      setLastMessageCount(newMessages.length);
      
      // Show notification for new messages (only in background refresh)
      if (isBackgroundRefresh && hasNewMessages && notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        const newMessageCount = newMessages.length - lastMessageCount;
        new Notification('New Messages', {
          body: `${newMessageCount} new message${newMessageCount > 1 ? 's' : ''} in ${eventTitle}`,
          icon: '/favicon.ico'
        });
      }
      
      setInitialLoad(false);
    } catch (error) {
      console.error('Error loading messages:', error);
      
      // Retry logic for network errors
      if (retryCount < 2 && (
        error.message.includes('Network') || 
        error.message.includes('protocol error') ||
        error.message.includes('Server error')
      )) {
        console.log(`Retrying message load (attempt ${retryCount + 1})...`);
        setTimeout(() => {
          loadMessages(retryCount + 1, isBackgroundRefresh);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // Show user-friendly error message (only on initial load or manual refresh)
      if (!isBackgroundRefresh) {
        setMessages([]);
        if (error.message.includes('Network connection failed')) {
          alert('Unable to connect to the server. Please check your internet connection and try refreshing the page.');
        } else if (error.message.includes('Connection protocol error')) {
          alert('Connection error detected. Please refresh the page to reconnect.');
        } else if (error.message.includes('Chat not found')) {
          alert('This event does not have a chat enabled or the chat is not available.');
        } else if (error.message.includes('Access denied')) {
          alert('You do not have permission to view this chat. Please contact the event organizer.');
        } else {
          alert('Failed to load chat messages. Please try refreshing the page.');
        }
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  }, [eventId, lastMessageCount, notificationsEnabled, eventTitle]);

  // Load participants
  const loadParticipants = useCallback(async () => {
    try {
      // Load both chat participants and event participants
      const [chatData, eventData] = await Promise.all([
        getEventChatParticipants(eventId).catch(() => ({ participants: [] })),
        getEventParticipantsPublic(eventId).catch(() => ({ participants: [] }))
      ]);
      
      const chatParticipants = chatData.participants || [];
      const eventParticipants = eventData.participants || [];
      
      // Combine and deduplicate participants
      const allParticipants = [...chatParticipants];
      eventParticipants.forEach(eventParticipant => {
        if (!allParticipants.find(p => p._id === eventParticipant._id)) {
          allParticipants.push(eventParticipant);
        }
      });
      
      setParticipants(allParticipants);
    } catch (error) {
      console.error('Error loading participants:', error);
      setParticipants([]);
    }
  }, [eventId]);

  // Enhanced file handling with drag and drop
  const handleFileSelect = useCallback((files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4', 'video/webm', 'video/ogg'
      ];
      
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported.`);
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    setShowFilePreview(true);
  }, []);

  const handleFileInputChange = useCallback((e) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // Remove selected file
  const removeFile = useCallback((index) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (newFiles.length === 0) {
        setShowFilePreview(false);
      }
      return newFiles;
    });
  }, []);


  // Enhanced send message function with optimistic updates
  const sendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    if (((!newMessage || !newMessage.trim()) && selectedFiles.length === 0) || sending) return;

    const messageText = newMessage.trim();
    const tempId = `temp_${Date.now()}`;
    
    // Create optimistic message
    const optimisticMessage = {
      _id: tempId,
      message: messageText,
      user: { name: user.name, _id: user._id },
      userId: user._id,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      replyTo: replyingTo ? { user: replyingTo.user, message: replyingTo.message } : null
    };

    try {
      setSending(true);
      
      // Add optimistic message immediately
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear form immediately for better UX
      setNewMessage('');
      setReplyingTo(null);
      setSelectedFiles([]);
      setShowFilePreview(false);
      
      let data;
      
      // If there are files, send them with the message
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('message', messageText || '');
        formData.append('messageType', 'file');
        if (replyingTo?.id) {
          formData.append('replyTo', replyingTo.id);
        }
        
        // Add files to form data
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });

        data = await sendEventChatMessageWithFiles(eventId, formData);
      } else {
        // Send text message only
        data = await sendEventChatMessage(eventId, messageText, replyingTo?.id || null);
      }
      
      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? { ...data.chatMessage, isOptimistic: false } : msg
      ));
      
      // Update message count
      setLastMessageCount(prev => prev + 1);
      
      // Refresh participants
      loadParticipants();
      
      // Show notification if enabled
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Message sent', {
          body: 'Your message has been sent successfully',
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      
      // Restore form content
      setNewMessage(messageText);
      setReplyingTo(replyingTo);
      
      alert(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedFiles, sending, replyingTo, eventId, loadParticipants, notificationsEnabled, user]);

  // Enhanced message actions
  const addReaction = useCallback(async (messageId, emoji) => {
    try {
      await addEventChatReaction(messageId, emoji);
      loadMessages(); // Refresh messages to show reactions
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, [loadMessages]);

  const editMessage = useCallback(async (messageId, newText) => {
    try {
      await editEventChatMessage(messageId, newText);
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, message: newText, isEdited: true, editedAt: new Date() }
          : msg
      ));
      setEditingMessage(null);
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message. Please try again.');
    }
  }, []);

  const deleteMessage = useCallback(async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteEventChatMessage(messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, []);

  const handleMessageAction = useCallback((action, message) => {
    switch (action) {
      case 'copy':
        copyToClipboard(message.message);
        break;
      case 'reply':
        setReplyingTo({ id: message._id, user: message.user, message: message.message });
        break;
      case 'edit':
        if (message.userId === user._id) {
          setEditingMessage(message);
        }
        break;
      case 'delete':
        if (message.userId === user._id) {
          deleteMessage(message._id);
        }
        break;
      default:
        break;
    }
    setShowMessageOptions(null);
  }, [copyToClipboard, deleteMessage, user._id]);

  // Enhanced emoji reactions
  const emojiReactions = useMemo(() => [
    { emoji: '👍', label: 'Thumbs up' },
    { emoji: '❤️', label: 'Love' },
    { emoji: '😂', label: 'Laugh' },
    { emoji: '😮', label: 'Wow' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '🎉', label: 'Celebrate' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '💯', label: 'Perfect' },
    { emoji: '👏', label: 'Clap' }
  ], []);

  // Load data on mount
  useEffect(() => {
    if (eventId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadMessages();
      loadParticipants();
      
      // Request notification permission
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      // Set up smart polling for new messages
      const interval = setInterval(() => {
        loadMessages(0, true); // Background refresh - no loading spinner
      }, 30000); // Poll every 30 seconds (reduced frequency)
      return () => clearInterval(interval);
    }
  }, [eventId, notificationsEnabled, loadMessages, loadParticipants]);

  // Focus input when replying
  useEffect(() => {
    if (replyingTo) {
      messageInputRef.current?.focus();
    }
  }, [replyingTo]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Filter messages based on search term
  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return messages;
    const searchLower = searchTerm.toLowerCase();
    return messages.filter(message => 
      message.message.toLowerCase().includes(searchLower) ||
      message.user?.name?.toLowerCase().includes(searchLower)
    );
  }, [messages, searchTerm]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = {};
    filteredMessages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  }, [filteredMessages]);

  // Validate eventId after all hooks
  if (!eventId) {
    return (
      <div className={`event-chat-container ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className="error-message">
          <h3>Error: No Event ID</h3>
          <p>Unable to load chat. Please close and try again.</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`event-chat-container ${isFullscreen ? 'fullscreen' : ''} ${dragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Modern Chat Header */}
      <div className="chat-header">
        <div className="header-left">
          <div className="chat-info">
            <h3 className="chat-title">{eventTitle}</h3>
            <div className="chat-status">
              <span className="status-dot"></span>
              <span>{participants.length} participants</span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className="refresh-btn"
            onClick={() => loadMessages()}
            title="Refresh messages"
            disabled={loading}
          >
            <FaRedoAlt />
          </button>
          
          <button 
            className="search-toggle"
            onClick={() => setShowSearch(!showSearch)}
            title="Search messages"
          >
            <FaSearch />
          </button>
          
          <button 
            className="close-btn" 
            onClick={onClose} 
            aria-label="Close chat"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="search-bar">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="messages-container">
        {loading && initialLoad ? (
          <div className="loading-state">
            <FaSpinner className="spinner" />
          </div>
        ) : (
          <>
            {Object.keys(groupedMessages).length === 0 ? (
              searchTerm ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <h3>No messages found</h3>
                  <p>No messages match "{searchTerm}"</p>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <h3>Start the conversation</h3>
                  <p>Be the first to send a message!</p>
                </div>
              )
            ) : (
              Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date} className="message-group">
                  <div className="date-divider">
                    <span>{new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  
                  {dateMessages.map((message) => (
                    <div key={message._id} className={`message ${message.userId === user._id ? 'sent' : 'received'} ${message.isOptimistic ? 'optimistic' : ''}`}>
                      <div className="message-content">
                        <div className="message-header">
                          <span 
                            className="sender-name"
                            onClick={() => viewProfile && message.user && viewProfile(message.user)}
                            title="Click to view profile"
                          >
                            {message.user?.name || 'Unknown'}
                          </span>
                          <span className="message-time">{formatTime(message.createdAt)}</span>
                          {message.isEdited && <span className="edited-indicator">(edited)</span>}
                          {message.isOptimistic && <span className="sending-indicator">Sending...</span>}
                        </div>
                        
                        {message.replyTo && (
                          <div className="reply-preview">
                            <div className="reply-content">
                              <strong>{message.replyTo.user?.name}:</strong>
                              <span>{message.replyTo.message}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="message-text">{message.message}</div>
                        
                        {/* Enhanced File Attachments */}
                        {(message.attachment || (message.attachments && message.attachments.length > 0)) && (
                          <div className="message-attachments">
                            {(message.attachments || [message.attachment]).map((attachment, index) => (
                              <div key={index} className="message-attachment">
                                {attachment.contentType?.startsWith('image/') ? (
                                  <div className="image-attachment">
                                    {!failedImages.has(attachment.url) ? (
                                      <div className="image-container">
                                        <img 
                                          src={getImageUrlWithFallback(attachment.url)} 
                                          alt={attachment.originalName}
                                          className="attachment-image"
                                          onLoad={() => {
                                            console.log('✅ Event chat image loaded:', attachment.url);
                                          }}
                                          onError={(e) => {
                                            console.error('❌ Failed to load event chat image:', attachment.url);
                                            console.error('❌ Constructed URL:', getImageUrlWithFallback(attachment.url));
                                            setFailedImages(prev => new Set([...prev, attachment.url]));
                                            // Try fallback image
                                            if (e.target.src !== '/logo.png') {
                                              e.target.src = '/logo.png';
                                            } else {
                                              e.target.style.display = 'none';
                                            }
                                          }}
                                          style={{ display: 'block' }}
                                          onClick={() => {
                                            // Create fullscreen image modal
                                            const modal = document.createElement('div');
                                            modal.className = 'image-modal-overlay';
                                            modal.innerHTML = `
                                              <div class="image-modal">
                                                <img src="${getAttachmentUrl(attachment.url)}" alt="${attachment.originalName}" />
                                                <button class="close-modal">×</button>
                                              </div>
                                            `;
                                            document.body.appendChild(modal);
                                            
                                            modal.onclick = (e) => {
                                              if (e.target === modal || e.target.classList.contains('close-modal')) {
                                                document.body.removeChild(modal);
                                              }
                                            };
                                          }}
                                        />
                                        <div className="image-overlay">
                                          <button 
                                            className="download-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              downloadFile(attachment);
                                            }}
                                            title="Download image"
                                          >
                                            <FaDownload />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="image-fallback">
                                        <FaImage className="fallback-icon" />
                                        <div className="fallback-content">
                                          <span className="fallback-text">Image not available</span>
                                          <span className="fallback-subtext">File may have been deleted or moved</span>
                                          <button 
                                            className="download-btn"
                                            onClick={() => downloadFile(attachment)}
                                            title="Try to download image"
                                          >
                                            <FaDownload />
                                            Try Download
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                    {failedImages.has(attachment.url) && (
                                      <div className="image-info">
                                        <span className="image-status">File not found</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="file-attachment">
                                    <div className="file-info">
                                      {getFileIcon({ type: attachment.contentType })}
                                      <div className="file-details">
                                        <span className="file-size">{formatFileSize(attachment.fileSize)}</span>
                                      </div>
                                    </div>
                                    <button 
                                      className="download-btn"
                                      onClick={() => downloadFile(attachment)}
                                      title="Download file"
                                    >
                                      <FaDownload />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Enhanced Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="message-reactions">
                            {Object.entries(
                              message.reactions.reduce((acc, reaction) => {
                                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                                return acc;
                              }, {})
                            ).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                className="reaction-btn"
                                onClick={() => addReaction(message._id, emoji)}
                                title={`React with ${emoji}`}
                              >
                                {emoji} {count}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Enhanced Message Actions */}
                        <div className="message-actions">
                          <button
                            className="action-btn"
                            onClick={() => handleMessageAction('reply', message)}
                            title="Reply"
                          >
                            <FaReply />
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => setShowEmojis(!showEmojis)}
                            title="React"
                          >
                            <FaSmile />
                          </button>
                          <button
                            className="action-btn"
                            onClick={() => handleMessageAction('copy', message)}
                            title="Copy"
                          >
                            <FaCopy />
                          </button>
                          {message.userId === user._id && (
                            <>
                              <button
                                className="action-btn"
                                onClick={() => handleMessageAction('edit', message)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => handleMessageAction('delete', message)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
            
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0]} is typing...`
                    : `${typingUsers.length} people are typing...`
                  }
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="reply-preview-bar">
          <div className="reply-info">
            <strong>Replying to {replyingTo.user?.name}:</strong>
            <span>{replyingTo.message}</span>
          </div>
          <button 
            className="cancel-reply"
            onClick={() => setReplyingTo(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Enhanced Emoji Picker */}
      {showEmojis && (
        <div className="emoji-picker">
          <div className="emoji-header">
            <span>Choose a reaction</span>
            <button 
              className="close-emoji"
              onClick={() => setShowEmojis(false)}
            >
              <FaTimes />
            </button>
          </div>
          <div className="emoji-grid">
            {emojiReactions.map(({ emoji, label }) => (
              <button
                key={emoji}
                className="emoji-btn"
                onClick={() => {
                  setNewMessage(prev => prev + emoji);
                  setShowEmojis(false);
                }}
                title={label}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced File Preview */}
      {showFilePreview && selectedFiles.length > 0 && (
        <div className="file-preview-container">
          <div className="file-preview-header">
            <span>Files to upload ({selectedFiles.length})</span>
            <button 
              className="close-preview-btn"
              onClick={() => {
                setShowFilePreview(false);
                setSelectedFiles([]);
              }}
            >
              <FaTimes />
            </button>
          </div>
          <div className="file-preview-list">
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-preview-item">
                {getFileIcon(file)}
                <div className="file-preview-info">
                  <span className="file-preview-name">{file.name}</span>
                  <span className="file-preview-size">{formatFileSize(file.size)}</span>
                </div>
                <button 
                  className="remove-file-btn"
                  onClick={() => removeFile(index)}
                  title="Remove file"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Enhanced Message Input */}
      <div className="message-input-container">
        <form className="message-input-form" onSubmit={sendMessage}>
          <div className="message-input-wrapper">
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type your message..."
              className="message-input"
              disabled={sending}
            />
            <div className="action-buttons">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar,video/*"
              />
              <button
                type="button"
                className="file-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload files"
              >
                <FaFile />
              </button>
              
              
              <button
                type="button"
                className="emoji-btn"
                onClick={() => setShowEmojis(!showEmojis)}
                title="Add emoji"
              >
                <FaSmile />
              </button>
              
              <button
                type="submit"
                className="send-btn"
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
                title="Send message"
              >
                {sending ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Enhanced Edit Message Form */}
      {editingMessage && (
        <div className="edit-message-form">
          <div className="edit-message-container">
            <input
              type="text"
              defaultValue={editingMessage.message}
              ref={(input) => input && input.focus()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  editMessage(editingMessage._id, e.target.value);
                } else if (e.key === 'Escape') {
                  setEditingMessage(null);
                }
              }}
              className="edit-message-input"
            />
            <div className="edit-actions">
              <button
                type="button"
                onClick={() => editMessage(editingMessage._id, document.querySelector('.edit-message-input').value)}
                className="save-edit-btn"
              >
                <FaCheck />
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingMessage(null)}
                className="cancel-edit-btn"
              >
                <FaTimes />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventChat;
