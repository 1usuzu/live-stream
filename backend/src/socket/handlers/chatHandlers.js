const Message = require('../../models/Message');
const { redis } = require('../../config/redis');
const logger = require('../../utils/logger');
const sanitizeHtml = require('sanitize-html');

// Bad words filter (simple implementation)
const BAD_WORDS = ['badword1', 'badword2']; // Add your list

const filterBadWords = (text) => {
  let filtered = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
};

// Sanitize user input to prevent XSS
const sanitizeMessage = (text) => {
  return sanitizeHtml(text, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {},
    disallowedTagsMode: 'escape'
  });
};

module.exports = (socket, io, rooms) => {

  // Send chat message
  socket.on('chat-message', async (data, callback) => {
    try {
      const { message } = data;
      const roomId = socket.roomId;

      if (!roomId) {
        return callback({ error: 'Not in a room' });
      }

      const room = rooms.get(roomId);
      if (!room) {
        return callback({ error: 'Room not found' });
      }

      // Validation
      if (!message || message.trim() === '') {
        return callback({ error: 'Message cannot be empty' });
      }

      if (message.length > 500) {
        return callback({ error: 'Message too long (max 500 characters)' });
      }

      // Rate limiting (5 messages per 10 seconds) - TEMPORARILY DISABLED
      // const rateLimitKey = `chat_rate:${socket.userId}:${roomId}`;
      // const messageCount = await redis.incr(rateLimitKey);

      // if (messageCount === 1) {
      //   await redis.expire(rateLimitKey, 10);
      // }

      // if (messageCount > 5) {
      //   const ttl = await redis.ttl(rateLimitKey);
      //   return callback({
      //     error: `Slow down! You can send another message in ${ttl} seconds`,
      //     retryAfter: ttl
      //   });
      // }

      // Sanitize and filter message
      let cleanMessage = sanitizeMessage(message.trim());
      cleanMessage = filterBadWords(cleanMessage);

      // Save to database
      const savedMessage = await Message.create({
        roomId: room.id,
        userId: socket.userId,
        username: socket.username,
        content: cleanMessage
      });

      const chatMessage = {
        id: savedMessage.id,
        userId: socket.userId,
        username: socket.username,
        message: cleanMessage,
        timestamp: savedMessage.created_at
      };

      // Add to room history (keep last 100)
      room.chatHistory.push(chatMessage);
      if (room.chatHistory.length > 100) {
        room.chatHistory.shift();
      }

      // Broadcast to room
      io.to(roomId).emit('new-message', chatMessage);

      // Update stats
      await redis.hincrby(`room:${roomId}:stats`, 'messageCount', 1);

      logger.debug(`Chat message in ${roomId} from ${socket.username}`);
      callback({ success: true, message: chatMessage });

    } catch (error) {
      logger.error('Chat message error:', error);
      callback({ error: 'Failed to send message' });
    }
  });

  // Delete message (streamer/moderator only)
  socket.on('delete-message', async (data, callback) => {
    try {
      const { messageId } = data;

      if (!socket.isStreamer) {
        return callback({ error: 'Not authorized' });
      }

      await Message.softDelete(messageId);

      // Remove from room history
      const room = rooms.get(socket.roomId);
      if (room) {
        room.chatHistory = room.chatHistory.filter(m => m.id !== messageId);
      }

      // Notify viewers
      io.to(socket.roomId).emit('message-deleted', { messageId });

      logger.info(`Message deleted: ${messageId} by ${socket.username}`);
      callback({ success: true });

    } catch (error) {
      logger.error('Delete message error:', error);
      callback({ error: 'Failed to delete message' });
    }
  });

  // Clear chat (streamer only)
  socket.on('clear-chat', async (callback) => {
    try {
      if (!socket.isStreamer || !socket.roomId) {
        return callback({ error: 'Not authorized' });
      }

      const room = rooms.get(socket.roomId);
      if (room) {
        room.chatHistory = [];
      }

      io.to(socket.roomId).emit('chat-cleared');

      logger.info(`Chat cleared in room: ${socket.roomId}`);
      callback({ success: true });

    } catch (error) {
      logger.error('Clear chat error:', error);
      callback({ error: 'Failed to clear chat' });
    }
  });

  // Timeout user (streamer only)
  socket.on('timeout-user', async (data, callback) => {
    try {
      const { userId, duration = 60 } = data; // duration in seconds

      if (!socket.isStreamer || !socket.roomId) {
        return callback({ error: 'Not authorized' });
      }

      const timeoutKey = `timeout:${socket.roomId}:${userId}`;
      await redis.setex(timeoutKey, duration, '1');

      io.to(socket.roomId).emit('user-timed-out', {
        userId,
        duration,
        by: socket.username
      });

      logger.info(`User ${userId} timed out for ${duration}s in room ${socket.roomId}`);
      callback({ success: true });

    } catch (error) {
      logger.error('Timeout user error:', error);
      callback({ error: 'Failed to timeout user' });
    }
  });

  // Send emoji reaction
  socket.on('send-reaction', async (data, callback) => {
    try {
      const { emoji } = data;

      if (!socket.roomId) {
        return callback({ error: 'Not in a room' });
      }

      // Rate limit reactions (10 per minute) - TEMPORARILY DISABLED
      // const rateLimitKey = `reaction_rate:${socket.userId}:${socket.roomId}`;
      // const count = await redis.incr(rateLimitKey);

      // if (count === 1) {
      //   await redis.expire(rateLimitKey, 60);
      // }

      // if (count > 10) {
      //   return callback({ error: 'Too many reactions' });
      // }

      // Broadcast reaction
      io.to(socket.roomId).emit('reaction', {
        userId: socket.userId,
        username: socket.username,
        emoji,
        timestamp: Date.now()
      });

      callback({ success: true });

    } catch (error) {
      logger.error('Send reaction error:', error);
      callback({ error: 'Failed to send reaction' });
    }
  });
};