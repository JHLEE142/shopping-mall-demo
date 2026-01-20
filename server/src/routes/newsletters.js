const { Router } = require('express');
const {
  subscribeNewsletter,
  unsubscribeNewsletter,
} = require('../controllers/newsletterController');

const router = Router();

router.post('/subscribe', subscribeNewsletter);
router.post('/unsubscribe', unsubscribeNewsletter);

module.exports = router;
