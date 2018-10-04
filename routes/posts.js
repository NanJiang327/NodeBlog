const express = require('express');
const router = express.Router();
const PostModel = require('../models/posts');
const CommentModel = require('../models/comments')

const checkLogin = require('../middlewares/check').checkLogin;

// Get /posts 所有用户或者特定用户的文章
// eg: GET /post?author=xxx
router.get('/', function(req, res, next) {
    const author = req.query.author;

    PostModel.getPosts(author)
        .then(function(posts) {
            res.render('posts', {
                posts: posts,
            })
        }).catch(next);
})

// POST /posts/create 发表一篇文章
router.post('/create', checkLogin, function(req, res, next) {
    const author = req.session.user._id;
    const title = req.fields.title;
    const content = req.fields.content;

    try {
        if (!title.length) {
            throw new Error('Please enter title');
        }
        if (!content.length) {
            throw new Error('Please enter content');
        }
    } catch (e) {
        req.flash('error', e.message);
        return res.redirect('back');
    }

    let post = {
        author: author,
        title: title,
        content: content,
    }

    PostModel.create(post)
        .then(function(result) {
        // 此post是插入mongodb后的值, 包含_id
            post = result.ops[0];
            req.flash('success', 'Posted');
            res.redirect(`/posts/${post._id}`);
        }).catch(next);
})

// GET /posts/create 发表文章页
router.get('/create', checkLogin, function(req, res, next) {
    res.render('create');
})

// GET /posts/:postId 单独一篇文章页
router.get('/:postId', function(req, res, next) {
    const postId = req.params.postId;

    Promise.all([
        PostModel.getPostById(postId), // 获取文章信息
        CommentModel.getComments(postId), // 获取该文章所有留言
        PostModel.incPv(postId), // pv 加 1
    ]).then(function(result) {
        const post = result[0];
        const comments = result[1];
        if (!post) {
            throw new Error('Article doesn\'t exist.');
        }

        res.render('post', {
            post: post,
            comments: comments,
        })
    })
        .catch(next);
})

// GET /posts/:postId/edit 更新文章页
router.get('/:postId/edit', checkLogin, function(req, res, next) {
    const postId = req.params.postId;
    const author = req.session.user._id;

    PostModel.getRawPostById(postId)
        .then(function(post) {
            if (!post) {
                throw new Error('The article doesn\'t exist.');
            }
            if (author.toString() !== post.author._id.toString()) {
                throw new Error('Not authorised');
            }
            res.render('edit', {
                post: post,
            })
        }).catch(next);
})

// POST /posts/:postId/edit 更新一篇文章
router.post('/:postId/edit', checkLogin, function(req, res, next) {
    const postId = req.params.postId
    const author = req.session.user._id
    const title = req.fields.title
    const content = req.fields.content

    // 校验参数
    try {
        if (!title.length) {
            throw new Error('Please enter the title.')
        }
        if (!content.length) {
            throw new Error('Please enter the content.')
        }
    } catch (e) {
        req.flash('error', e.message)
        return res.redirect('back')
    }

    PostModel.getRawPostById(postId)
        .then(function(post) {
            if (!post) {
                throw new Error('The article doesn\'t exist.')
            }
            if (post.author._id.toString() !== author.toString()) {
                throw new Error('Not authorised')
            }
            PostModel.updatePostById(postId, {title: title, content: content})
                .then(function() {
                    req.flash('success', 'Comfired')
                    // 编辑成功后跳转到上一页
                    res.redirect(`/posts/${postId}`)
                })
                .catch(next)
        })
})

// GET /posts/:postId/remove 删除一篇文章
router.get('/:postId/remove', checkLogin, function(req, res, next) {
    const postId = req.params.postId
    const author = req.session.user._id

    PostModel.getRawPostById(postId)
        .then(function(post) {
            if (!post) {
                throw new Error('The article doesn\'t exist.')
            }
            if (post.author._id.toString() !== author.toString()) {
                throw new Error('Not authorised')
            }
            PostModel.delPostById(postId)
                .then(function() {
                    req.flash('success', 'Deleted')
                    // 删除成功后跳转到主页
                    res.redirect('/posts')
                })
                .catch(next)
        })
})

module.exports = router;
