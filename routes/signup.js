const fs = require('fs');
const path = require('path');
const sha1 = require('sha1');
const express = require('express');
const router = express.Router();

const UserModel = require('../models/users')
const checkNotLogin = require('../middlewares/check').checkNotLogin;

// GET /signup 注册页
router.get('/', checkNotLogin, function(req, res, next) {
    res.render('signup');
})

// POST /signup 用户注册
router.post('/', checkNotLogin, function(req, res, next) {
    const name = req.fields.name;
    const gender = req.fields.gender;
    const bio = req.fields.bio;
    const avatar = req.files.avatar.path.split(path.sep).pop();
    let password = req.fields.password;
    const repassword = req.fields.repassword;

    // 校验参数
    try {
        if (!(name.length >= 1 && name.length <= 10)) {
            throw new Error('Length of username between 6 - 10')
        }
        if (['m', 'f', 'x'].indexOf(gender) === -1) {
            throw new Error('Gender only can be male, female or unknow')
        }
        if (!(bio.length >= 1 && bio.length <= 30)) {
            throw new Error('Self-intro should contains at least 6 characters and at most 30 characters')
        }
        if (!req.files.avatar.name) {
            throw new Error('Please upload an icon')
        }
        if (password.length < 6) {
            throw new Error('Password should contains at least 6 characters')
        }
        if (password !== repassword) {
            throw new Error('Re-password doesn\'t match the password');
        }
    } catch (e) {
    // 注册失败，异步删除上传的头像
        fs.unlink(req.files.avatar.path)
        req.flash('error', e.message)
        return res.redirect('/signup')
    }

    password = sha1(password);

    // 待写入数据库的用户信息
    let user = {
        name: name,
        password: password,
        gender: gender,
        bio: bio,
        avatar: avatar,
    }

    // 用户信息写入数据库
    UserModel.create(user)
        .then(function(result) {
            // 此 user 是插入 mongodb 后的值, 包含_id
            user = result.ops[0]
            // 删除密码这种敏感信息, 将用户信息存入session
            delete user.password
            req.session.user = user
            // 写入 flash
            req.flash('success', 'Success');
            // 跳转到首页
            res.redirect('/posts');
        })
        .catch(function(e) {
            // 注册失败, 异步删除上传头像
            fs.unlink(req.files.avatar.path);
            // 用户名被占用则调回注册页
            if (e.message.match('duplicate key')) {
                req.flash('error', 'User already exists');
                return res.redirect('/signup');
            }
            next(e);
        })
});

module.exports = router;
