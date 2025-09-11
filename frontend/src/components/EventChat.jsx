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
  FaHeart, 
  FaLaugh, 
  FaAngry, 
  FaFile, 
  FaDownload, 
  FaTimes,
  FaEllipsisV,
  FaCopy,
  FaShare,
  FaMicrophone,
  FaStop,
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
import { getEventChatMessages, sendEventChatMessage, sendEventChatMessageWithFiles, getEventChatParticipants, addEventChatReaction, deleteEventChatMessage, editEventChatMessage } from '../api/api';
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
  
  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  
  // Message status
  const [messageStatus, setMessageStatus] = useState({});
  
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
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    } else if (file.type.startsWith('audio/')) {
      return <FaVolumeUp className="file-icon audio" />;
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

  const shareMessage = useCallback(async (message) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shared Message',
          text: message.message,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyToClipboard(message.message);
    }
  }, [copyToClipboard]);

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

  // Load messages with retry logic
  const loadMessages = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      const data = await getEventChatMessages(eventId);
      setMessages(data.messages || []);
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
          loadMessages(retryCount + 1);
        }, 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // Show user-friendly error message
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
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Load participants
  const loadParticipants = useCallback(async () => {
    try {
      const data = await getEventChatParticipants(eventId);
      setParticipants(data.participants || []);
    } catch (error) {
      console.error('Error loading participants:', error);
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
        'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg',
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

  // Audio recording functionality
  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError') {
        alert('Microphone permission denied. Please allow microphone access to record voice messages.');
      } else if (err.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone to record voice messages.');
      } else {
        alert('Unable to access microphone. Please check your microphone settings.');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const sendAudioMessage = useCallback(async () => {
    if (!audioBlob) return;

    try {
      setSending(true);
      const formData = new FormData();
      formData.append('files', audioBlob, 'voice-message.webm');
      formData.append('messageType', 'audio');
      formData.append('content', 'Voice message');

      const data = await sendEventChatMessageWithFiles(eventId, formData);
      setMessages(prev => [...prev, data.chatMessage]);
      setAudioBlob(null);
    } catch (error) {
      console.error('Error sending audio message:', error);
      alert('Failed to send voice message: ' + error.message);
    } finally {
      setSending(false);
    }
  }, [audioBlob, eventId]);

  // Enhanced send message function
  const sendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    if ((!newMessage || !newMessage.trim()) && selectedFiles.length === 0 && !audioBlob || sending) return;

    try {
      setSending(true);
      
      // If there are files, send them with the message
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('message', newMessage.trim() || '');
        formData.append('messageType', 'file');
        if (replyingTo?.id) {
          formData.append('replyTo', replyingTo.id);
        }
        
        // Add files to form data
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });

        const data = await sendEventChatMessageWithFiles(eventId, formData);
        setMessages(prev => [...prev, data.chatMessage]);
      } else if (audioBlob) {
        // Send audio message
        await sendAudioMessage();
      } else {
        // Send text message only
        const data = await sendEventChatMessage(eventId, newMessage.trim(), replyingTo?.id || null);
        setMessages(prev => [...prev, data.chatMessage]);
      }
      
      // Clear form
      setNewMessage('');
      setReplyingTo(null);
      setSelectedFiles([]);
      setShowFilePreview(false);
      setAudioBlob(null);
      
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
      alert(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedFiles, audioBlob, sending, replyingTo, eventId, sendAudioMessage, loadParticipants, notificationsEnabled]);

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
      case 'share':
        shareMessage(message);
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
  }, [copyToClipboard, shareMessage, deleteMessage, user._id]);

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
      
      // Set up polling for new messages (less frequent)
      const interval = setInterval(() => {
        loadMessages();
      }, 15000); // Poll every 15 seconds
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
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" />
            <span>Loading messages...</span>
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
                    <div key={message._id} className={`message ${message.userId === user._id ? 'sent' : 'received'}`}>
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
                                    <img 
                                      src={getAttachmentUrl(attachment.url)} 
                                      alt={attachment.originalName}
                                      className="attachment-image"
                                      onError={(e) => {
                                        console.error('Image failed to load:', getAttachmentUrl(attachment.url));
                                        e.target.style.display = 'none';
                                        const fallback = e.target.nextSibling;
                                        if (fallback) fallback.style.display = 'block';
                                      }}
                                      onLoad={() => {
                                        console.log('Image loaded successfully:', getAttachmentUrl(attachment.url));
                                      }}
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
                                    <div className="image-fallback" style={{display: 'none'}}>
                                      <FaImage />
                                      <span>Image failed to load</span>
                                      <button 
                                        className="download-btn"
                                        onClick={() => {
                                          try {
                                            const fileUrl = getAttachmentUrl(attachment.url);
                                            console.log('Downloading image:', fileUrl);
                                            const link = document.createElement('a');
                                            link.href = fileUrl;
                                            link.download = attachment.originalName;
                                            link.target = '_blank';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                          } catch (error) {
                                            console.error('Error downloading image:', error);
                                            alert('Failed to download image. Please try again.');
                                          }
                                        }}
                                        title="Download image"
                                      >
                                        <FaDownload />
                                      </button>
                                    </div>
                                    <div className="image-info">
                                      <span className="image-name">{attachment.originalName}</span>
                                    </div>
                                  </div>
                                ) : attachment.contentType?.startsWith('audio/') ? (
                                  <div className="audio-attachment">
                                    <div className="audio-player">
                                      <FaVolumeUp className="audio-icon" />
                                      <audio controls>
                                        <source src={getAttachmentUrl(attachment.url)} type={attachment.contentType} />
                                        Your browser does not support the audio element.
                                      </audio>
                                    </div>
                                    <div className="audio-info">
                                      <span className="audio-name">{attachment.originalName}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="file-attachment">
                                    <div className="file-info">
                                      {getFileIcon({ type: attachment.contentType })}
                                      <div className="file-details">
                                        <span className="file-name">{attachment.originalName}</span>
                                        <span className="file-size">{formatFileSize(attachment.fileSize)}</span>
                                      </div>
                                    </div>
                                    <button 
                                      className="download-btn"
                                      onClick={() => {
                                        try {
                                          const fileUrl = getAttachmentUrl(attachment.url);
                                          console.log('Downloading file:', fileUrl);
                                          const link = document.createElement('a');
                                          link.href = fileUrl;
                                          link.download = attachment.originalName;
                                          link.target = '_blank';
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        } catch (error) {
                                          console.error('Error downloading file:', error);
                                          alert('Failed to download file. Please try again.');
                                        }
                                      }}
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
                          <button
                            className="action-btn"
                            onClick={() => handleMessageAction('share', message)}
                            title="Share"
                          >
                            <FaShare />
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

      {/* Audio Preview */}
      {audioBlob && (
        <div className="audio-preview-container">
          <div className="audio-preview-header">
            <span>Voice message ready</span>
            <button 
              className="remove-audio-btn"
              onClick={() => setAudioBlob(null)}
            >
              <FaTimes />
            </button>
          </div>
          <div className="audio-preview-player">
            <audio controls>
              <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
            </audio>
            <button 
              className="send-audio-btn"
              onClick={sendAudioMessage}
              disabled={sending}
            >
              <FaPaperPlane />
              Send Voice Message
            </button>
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
                accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar,audio/*,video/*"
              />
              <button
                type="button"
                className="file-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload files"
              >
                <FaFile />
              </button>
              
              {!isRecording ? (
                <button
                  type="button"
                  className="record-btn"
                  onClick={startRecording}
                  title="Record voice message"
                >
                  <FaMicrophone />
                </button>
              ) : (
                <button
                  type="button"
                  className="stop-record-btn"
                  onClick={stopRecording}
                  title="Stop recording"
                >
                  <FaStop />
                </button>
              )}
              
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
                disabled={(!newMessage.trim() && selectedFiles.length === 0 && !audioBlob) || sending}
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
