const express = require('express');
const router = express.Router();
const sha1 = require('sha1');

const UserModel = require('../models/users')
const checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /signin 登录页
router.get('/', checkNotLogin, function(req, res, next) {
    res.render('signin');
})

// POST /signin 用户登录
router.post('/', checkNotLogin, function(req, res, next) {
    const name = req.fields.name;
    const password = req.fields.password;

    // 效验参数
    try {
        if (!name.length) {
            throw new Error('Please enter username');
        }
        if (!password.length) {
            throw new Error('Please enter password');
        }
    } catch (e) {
        req.flash('error', e.message);
        return res.redirect('back');
    }

    UserModel.getUserByName(name)
        .then(function(user) {
            if (!user) {
                req.flash('error', 'User doesn\'t existed');
                return res.redirect('back');
            }

            // check password match
            if (sha1(password) !== user.password) {
                req.flash('error', 'Check your password or username');
                return res.redirect('back');
            }
            req.flash('success', 'Logged In');
            delete user.password;
            req.session.user = user;
            // 跳转到主页
            res.redirect('/posts');
        }).catch(next);
});

module.exports = router;
