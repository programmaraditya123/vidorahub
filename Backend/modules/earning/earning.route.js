const express = require('express')
const { requireSignIn } = require('../auth/auth.middleware')
const { getEarnings } = require('./earning.contoller')

const router = express.Router()

router.get('/getEarnings',requireSignIn,getEarnings)

module.exports = router