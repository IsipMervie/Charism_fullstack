// frontend/src/components/EventChat.jsx
// Event Chat Component for real-time messaging

import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaSmile, FaImage, FaReply, FaEdit, FaTrash, FaThumbsUp, FaHeart, FaLaugh, FaAngry } from 'react-icons/fa';
import { getEventChatMessages, sendEventChatMessage, getEventChatParticipants, addEventChatReaction, deleteEventChatMessage, editEventChatMessage } from '../api/api';
import './EventChat.css';

const EventChat = ({ eventId, eventTitle, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages
  const loadMessages = async () => {
    try {
      setLoading(true);
      console.log('Loading messages for event:', eventId);
      const data = await getEventChatMessages(eventId);
      console.log('Messages loaded:', data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      console.log('Event ID:', eventId);
      console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));
    } finally {
      setLoading(false);
    }
  };

  // Load participants
  const loadParticipants = async () => {
    try {
      const data = await getEventChatParticipants(eventId);
      setParticipants(data.participants || []);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const data = await sendEventChatMessage(eventId, newMessage.trim(), replyingTo?.id || null);
      setMessages(prev => [...prev, data.chatMessage]);
      setNewMessage('');
      setReplyingTo(null);
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
    if (eventId) {
      loadMessages();
      loadParticipants();
      
      // Set up polling for new messages
      const interval = setInterval(loadMessages, 3000);
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

  return (
    <div className="event-chat-container">
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

      {/* Messages Area */}
      <div className="messages-container">
        {loading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message._id} className={`message ${message.userId === user._id ? 'own-message' : ''}`}>
                <div className="message-content">
                  <div className="message-header">
                    <span className="sender-name">{message.user?.name || 'Unknown'}</span>
                    <span className="message-time">{formatTime(message.createdAt)}</span>
                    {message.isEdited && <span className="edited-indicator">(edited)</span>}
                  </div>
                  
                  {message.replyTo && (
                    <div className="reply-preview">
                      <strong>{message.replyTo.user?.name}:</strong> {message.replyTo.message}
                    </div>
                  )}
                  
                  <div className="message-text">{message.message}</div>
                  
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
            ))}
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
            disabled={!newMessage.trim() || sending}
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
