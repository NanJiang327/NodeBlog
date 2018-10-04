const express = require('express');
const router = express.Router();
const checkLogin = require('../middlewares/check').checkLogin;

// GET /signout 退出
router.get('/', checkLogin, function(req, res, next) {
    // 清空 session 中用户信息
    req.session.user = null;
    req.flash('success', 'Logged Out');
    // 退出成功后跳转到主页
    res.redirect('/posts');
})

module.exports = router;
