const { create, getAll, getById } = require('./firebaseHelpers');

exports.createNotification = async (data, io = null) => {
  try {
    const recipient = data.recipient?.toString?.() || data.recipient;
    const sender = data.sender?.toString?.() || data.sender;
    if (recipient === sender) return;

    const notification = await create('notifications', {
      recipient,
      sender,
      type: data.type,
      entityId: data.entityId?.toString?.() || data.entityId,
      entityType: data.entityType,
      content: data.content || '',
      isRead: false
    });

    if (io) {
      const senderUser = await getById('users', sender);
      io.to(recipient).emit('new_notification', {
        ...notification,
        sender: senderUser
          ? {
              id: senderUser.id,
              name: senderUser.name || senderUser.fullName,
              username: senderUser.username,
              profileImage: senderUser.profileImage
            }
          : null
      });
    }
  } catch (error) {
    console.error('Notification creation failed:', error);
  }
};

exports.parseMentionsAndHashtags = async (content) => {
  const mentions = [];
  const hashtags = [];

  const hashtagRegex = /#(\w+)/g;
  let match;
  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push(match[1]);
  }

  const mentionRegex = /@(\w+)/g;
  const potentialUsernames = [];
  while ((match = mentionRegex.exec(content)) !== null) {
    potentialUsernames.push(match[1]);
  }

  if (potentialUsernames.length > 0) {
    const users = await getAll('users');
    users.forEach((user) => {
      if (potentialUsernames.includes(user.username)) {
        mentions.push(user.id);
      }
    });
  }

  return { mentions, hashtags };
};
