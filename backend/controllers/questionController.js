const { getById, create, updateById, filter } = require('../utils/firebaseHelpers');

exports.askQuestion = async (req, res) => {
  try {
    const { content, targetId, targetType, isAnonymous } = req.body;

    if (targetType === 'User') {
      const user = await getById('users', targetId);
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    } else if (targetType === 'Startup') {
      const startup = await getById('startups', targetId);
      if (!startup) return res.status(404).json({ success: false, error: 'Startup not found' });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid target type' });
    }

    const question = await create('questions', {
      content,
      targetId,
      targetType,
      authorId: req.user && !isAnonymous ? req.user.id : null,
      isPublic: false,
      isHidden: false
    });

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const normalizedType = targetType.charAt(0).toUpperCase() + targetType.slice(1);

    let questions = await filter(
      'questions',
      (q) =>
        q.targetType === normalizedType &&
        q.targetId === targetId &&
        q.isPublic === true &&
        q.isHidden !== true
    );

    questions = questions.sort((a, b) => (b.answeredAt || b.createdAt || 0) - (a.answeredAt || a.createdAt || 0));

    const populated = await Promise.all(
      questions.map(async (q) => {
        if (q.authorId) {
          const author = await getById('users', q.authorId);
          if (author) {
            q.authorId = { id: author.id, name: author.name || author.fullName, username: author.username, profileImage: author.profileImage };
          }
        }
        return q;
      })
    );

    res.status(200).json({ success: true, count: populated.length, data: populated });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};

exports.getInbox = async (req, res) => {
  try {
    const userQuestions = await filter(
      'questions',
      (q) => q.targetId === req.user.id && q.targetType === 'User' && !q.answer && q.isHidden !== true
    );
    userQuestions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const startups = await filter('startups', (s) => s.founderId === req.user.id);
    const startupIds = startups.map((s) => s.id);

    const startupQuestions = (await filter('questions', (q) => startupIds.includes(q.targetId) && q.targetType === 'Startup' && !q.answer && q.isHidden !== true)).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    res.status(200).json({ success: true, data: { user: userQuestions, startups: startupQuestions } });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};

exports.answerQuestion = async (req, res) => {
  try {
    const question = await getById('questions', req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    let isOwner = false;
    if (question.targetType === 'User') {
      if (question.targetId === req.user.id) isOwner = true;
    } else if (question.targetType === 'Startup') {
      const startup = await getById('startups', question.targetId);
      if (startup && startup.founderId === req.user.id) isOwner = true;
    }

    if (!isOwner) {
      return res.status(401).json({ success: false, error: 'Not authorized to answer this question' });
    }

    const updated = await updateById('questions', req.params.id, {
      answer: req.body.answer,
      answeredAt: Date.now(),
      isPublic: true
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};

exports.hideQuestion = async (req, res) => {
  try {
    const question = await getById('questions', req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    let isOwner = false;
    if (question.targetType === 'User') {
      if (question.targetId === req.user.id) isOwner = true;
    } else if (question.targetType === 'Startup') {
      const startup = await getById('startups', question.targetId);
      if (startup && startup.founderId === req.user.id) isOwner = true;
    }

    if (!isOwner) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    await updateById('questions', req.params.id, { isHidden: true });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};
