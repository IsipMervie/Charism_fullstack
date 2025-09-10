// frontend/src/components/EventChat.jsx
// Event Chat Component for real-time messaging

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPaperPlane, FaSmile, FaImage, FaReply, FaEdit, FaTrash, FaThumbsUp, FaHeart, FaLaugh, FaAngry, FaFile, FaDownload, FaTimes } from 'react-icons/fa';
import { getEventChatMessages, sendEventChatMessage, sendEventChatMessageWithFiles, getEventChatParticipants, addEventChatReaction, deleteEventChatMessage, editEventChatMessage } from '../api/api';
import { API_URL } from '../config/environment';
import './EventChat.css';

const EventChat = ({ eventId, eventTitle, onClose, viewProfile, isFullscreen = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper function to construct full URL for attachments
  const getAttachmentUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };
  const [sending, setSending] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showFilePreview, setShowFilePreview] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEventChatMessages(eventId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
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

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    setShowFilePreview(true);
  };

  // Remove selected file
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length === 1) {
      setShowFilePreview(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <FaImage className="file-icon image" />;
    }
    return <FaFile className="file-icon" />;
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage || !newMessage.trim()) && selectedFiles.length === 0 || sending) return;

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
        selectedFiles.forEach((file, index) => {
          formData.append(`files`, file);
        });

        const data = await sendEventChatMessageWithFiles(eventId, formData);
        setMessages(prev => [...prev, data.chatMessage]);
      } else {
        // Send text message only
        const data = await sendEventChatMessage(eventId, newMessage.trim(), replyingTo?.id || null);
        setMessages(prev => [...prev, data.chatMessage]);
      }
      
      setNewMessage('');
      setReplyingTo(null);
      setSelectedFiles([]);
      setShowFilePreview(false);
      loadParticipants(); // Refresh participants
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Add reaction
  const addReaction = async (messageId, emoji) => {
    try {
      await addEventChatReaction(messageId, emoji);
      loadMessages(); // Refresh messages to show reactions
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Edit message
  const editMessage = async (messageId, newText) => {
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
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteEventChatMessage(messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (eventId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadMessages();
      loadParticipants();
      
      // Set up polling for new messages (less frequent)
      const interval = setInterval(() => {
        loadMessages();
      }, 15000); // Poll every 15 seconds
      return () => clearInterval(interval);
    }
  }, [eventId]);

  // Focus input when replying
  useEffect(() => {
    if (replyingTo) {
      messageInputRef.current?.focus();
    }
  }, [replyingTo]);

  const formatTime = (dateString) => {
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
  };

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  // Filter messages based on search term
  const filteredMessages = messages.filter(message => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      message.message.toLowerCase().includes(searchLower) ||
      message.user?.name?.toLowerCase().includes(searchLower)
    );
  });

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
    <div className={`event-chat-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title">
          <h3>Event Chat</h3>
          <p>{eventTitle}</p>
        </div>
        <div className="chat-actions">
          <span className="participant-count">{participants.length} participants</span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="chat-search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search messages..."
          className="chat-search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search-btn"
            onClick={() => setSearchTerm('')}
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {loading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : (
          <>
            {filteredMessages.length === 0 && searchTerm ? (
              <div className="no-search-results">
                <p>No messages found matching "{searchTerm}"</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
              <div key={message._id} className={`message ${message.userId === user._id ? 'own-message' : ''}`}>
                <div className="message-content">
                  <div className="message-header">
                    <span 
                      className="sender-name clickable"
                      onClick={() => viewProfile && message.user && viewProfile(message.user)}
                      title="Click to view profile"
                      style={{ cursor: viewProfile ? 'pointer' : 'default' }}
                    >
                      {message.user?.name || 'Unknown'}
                    </span>
                    <span className="message-time">{formatTime(message.createdAt)}</span>
                    {message.isEdited && <span className="edited-indicator">(edited)</span>}
                  </div>
                  
                  {message.replyTo && (
                    <div className="reply-preview">
                      <strong>{message.replyTo.user?.name}:</strong> {message.replyTo.message}
                    </div>
                  )}
                  
                  <div className="message-text">{message.message}</div>
                  
                  {/* File Attachments */}
                  {message.attachment && (
                    <div className="message-attachment">
                      {message.messageType === 'image' ? (
                        <div className="image-attachment">
                          <img 
                            src={getAttachmentUrl(message.attachment.url)} 
                            alt={message.attachment.originalName}
                            className="attachment-image"
                            onClick={() => {
                              // Create fullscreen image modal
                              const modal = document.createElement('div');
                              modal.style.cssText = `
                                position: fixed;
                                top: 0;
                                left: 0;
                                width: 100vw;
                                height: 100vh;
                                background: rgba(0,0,0,0.9);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                z-index: 10000;
                                cursor: pointer;
                              `;
                              
                              const img = document.createElement('img');
                              img.src = getAttachmentUrl(message.attachment.url);
                              img.style.cssText = `
                                max-width: 90vw;
                                max-height: 90vh;
                                object-fit: contain;
                                border-radius: 8px;
                              `;
                              
                              modal.appendChild(img);
                              document.body.appendChild(modal);
                              
                              modal.onclick = () => document.body.removeChild(modal);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="file-attachment">
                          <div className="file-info">
                            {getFileIcon({ type: message.attachment.contentType })}
                            <div className="file-details">
                              <span className="file-name">{message.attachment.originalName}</span>
                              <span className="file-size">{formatFileSize(message.attachment.fileSize)}</span>
                            </div>
                          </div>
                          <button 
                            className="download-btn"
                            onClick={() => window.open(getAttachmentUrl(message.attachment.url), '_blank')}
                            title="Download file"
                          >
                            <FaDownload />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Reactions */}
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
                        >
                          {emoji} {count}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Message Actions */}
                  <div className="message-actions">
                    <button
                      className="action-btn"
                      onClick={() => setReplyingTo({ id: message._id, user: message.user, message: message.message })}
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
                    {message.userId === user._id && (
                      <>
                        <button
                          className="action-btn"
                          onClick={() => setEditingMessage(message)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => deleteMessage(message._id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="reply-preview-bar">
          <div className="reply-info">
            <strong>Replying to {replyingTo.user?.name}:</strong> {replyingTo.message}
          </div>
          <button onClick={() => setReplyingTo(null)}>×</button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojis && (
        <div className="emoji-picker">
          {emojis.map(emoji => (
            <button
              key={emoji}
              className="emoji-btn"
              onClick={() => {
                // Add emoji to current message or create new message
                setNewMessage(prev => prev + emoji);
                setShowEmojis(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* File Preview */}
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

      {/* Message Input */}
      <form className="message-input-form" onSubmit={sendMessage}>
        <div className="message-input-container">
          <input
            ref={messageInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="message-input"
            disabled={sending}
          />
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
          />
          <button
            type="button"
            className="file-btn"
            onClick={() => document.getElementById('file-upload').click()}
            title="Upload files"
          >
            <FaFile />
          </button>
          <button
            type="button"
            className="emoji-btn"
            onClick={() => setShowEmojis(!showEmojis)}
          >
            <FaSmile />
          </button>
          <button
            type="submit"
            className="send-btn"
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
          >
            <FaPaperPlane />
          </button>
        </div>
      </form>

      {/* Edit Message Form */}
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
            <button
              type="button"
              onClick={() => editMessage(editingMessage._id, document.querySelector('.edit-message-input').value)}
              className="save-edit-btn"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingMessage(null)}
              className="cancel-edit-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventChat;
