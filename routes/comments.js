const express = require('express');
const router = express.Router();
const checkLogin = require('../middlewares/check').checkLogin;
const CommentModel = require('../models/comments');

// POST /comments 创建一条留言
router.post('/', checkLogin, function(req, res, next) {
    const author = req.session.user._id;
    const postId = req.fields.postId;
    const content = req.fields.content;

    try {
        if (!content.length) {
            throw new Error('Please enter comment');
        }
    } catch (e) {
        req.flash('error', e.message)
        return res.redirect('back');
    }

    const comment = {
        author: author,
        postId: postId,
        content: content,
    }

    CommentModel.create(comment)
        .then(function() {
            req.flash('success', 'Posted');
            // 留言成功后跳转到上一页
            res.redirect('back');
        })
        .catch(next);
})

// GET /comments/:commentId/remove 删除一条留言
router.get('/:commentId/remove', checkLogin, function(req, res, next) {
    const commentId = req.params.commentId;
    const author = req.session.user._id;

    CommentModel.getCommentById(commentId)
        .then(function(comment) {
            if (!comment) {
                throw new Error('Comment doesn\'t exist');
            }
            if (comment.author.toString() !== author.toString()) {
                throw new Error('You are not the author of this comment.');
            }
            CommentModel.delCommentById(commentId)
                .then(function() {
                    req.flash('success', 'Deleted');
                    // 删除成功后跳转上一页
                    res.redirect('back');
                })
                .catch(next)
        })
})

module.exports = router;
