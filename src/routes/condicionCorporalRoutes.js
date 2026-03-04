const express = require('express');
const router = express.Router();
const {
    getCondiciones, getCondicionById,
    createCondicion, updateCondicion, deleteCondicion
} = require('../controllers/condicionCorporalController');

router.get('/', getCondiciones);
router.get('/:id', getCondicionById);
router.post('/', createCondicion);
router.put('/:id', updateCondicion);
router.delete('/:id', deleteCondicion);

module.exports = router;
