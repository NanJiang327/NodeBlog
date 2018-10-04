const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const config = require('config-lite')(__dirname);
const routes = require('./routes');
const pkg = require('./package');
const winston = require('winston');
const expressWinston = require('express-winston');

const app = express();

// 设置模板目录
app.set('views', path.join(__dirname, 'views'));
// 设置模板引擎为ejs
app.set('view engine', 'ejs');

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));
// session 中间件
app.use(session({
    name: config.session.key, // 设置cookie中保存session id 的字段名称
    secret: config.session.secret, // 设置secret来计算hash值并放在cookie中, 使产生的signedCookie 防篡改
    resave: true, // 强制更新session
    saveUninitialized: false, // 设置为false, 强制创建一个session, 即使用户未登录
    cookie: {
        maxAge: config.session.maxAge, // 过期时间, 过期后cookie中的session id 自动删除
    },
    store: new MongoStore({ // 将session 存到mongodb
        url: config.mongodb, // mongodb 的地址
    }),
}));

// flash中间件, 用来显示通知
app.use(flash());


// 设置模板的全局变量
app.locals.blog = {
    title: pkg.name,
    description: pkg.description,
}

// 添加模板必须的三个变量
app.use(function(req, res, next) {
    res.locals.user = req.session.user
    res.locals.success = req.flash('success').toString()
    res.locals.error = req.flash('error').toString()
    next()
})

app.use(require('express-formidable')({
    uploadDir: path.join(__dirname, 'public/img'), // 上传文件目录
    keepExtensions: true, // 保留后缀
}));

app.use(function(err, req, res, next) {
    console.error(err);
    req.flash('error', err.message);
    res.redirect('/posts');
})

// 正常请求的日志
// app.use(expressWinston.logger({
//     transports: [
//         new (winston.transports.Console)({
//             json: true,
//             colorize: true,
//         }),
//         new winston.transports.File({
//             filename: 'logs/success.log',
//         }),
//     ],
// }))

// 路由
routes(app)

// 错误的请求日志
// app.use(expressWinston.errorLogger({
//     transports: [
//         new winston.transports.Console({
//             json: true,
//             colorize: true,
//         }),
//         new winston.transports.File({
//             filename: 'logs/error.log',
//         }),
//     ],
// }))

if (module.parent) {
    // 被require, 则导出 app
    module.exports = app
} else {
    // 监听端口, 启动程序
    app.listen(config.port, function() {
        console.log(`${pkg.name} listening on port ${config.port}`);
    });
}
