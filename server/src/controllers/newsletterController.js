const NewsletterSubscription = require('../models/newsletterSubscription');

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

async function subscribeNewsletter(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const source = req.body.source || 'site';
    const metadata = req.body.metadata || {};

    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    const existing = await NewsletterSubscription.findOne({ email });
    if (existing) {
      if (existing.status === 'active') {
        return res.json({ message: '이미 구독 중입니다.' });
      }

      existing.status = 'active';
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = null;
      existing.source = source;
      existing.metadata = metadata;
      await existing.save();
      return res.json({ message: '구독이 다시 활성화되었습니다.' });
    }

    await NewsletterSubscription.create({
      email,
      source,
      metadata,
      status: 'active',
      subscribedAt: new Date(),
    });

    return res.status(201).json({ message: '뉴스레터 구독이 완료되었습니다.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: '이미 구독 중입니다.' });
    }
    next(error);
  }
}

async function unsubscribeNewsletter(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    const subscription = await NewsletterSubscription.findOne({ email });
    if (!subscription) {
      return res.json({ message: '구독 정보가 없습니다.' });
    }

    subscription.status = 'unsubscribed';
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    return res.json({ message: '구독이 해지되었습니다.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  subscribeNewsletter,
  unsubscribeNewsletter,
};
