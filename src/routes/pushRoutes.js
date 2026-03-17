const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pushSubscriptionController');

router.get('/vapid-public-key', ctrl.getVapidKey);
router.get('/is-subscribed', ctrl.isSubscribed);
router.post('/subscribe', ctrl.subscribe);
router.delete('/unsubscribe', ctrl.unsubscribe);

module.exports = router;
