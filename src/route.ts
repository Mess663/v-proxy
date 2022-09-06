import Router from 'koa-router';
import ip from 'ip'
import os from 'os'

const router = new Router()

router.get('/local-info', ctx => {
    ctx.header['access-control-allow-credentials'] = 'true'
    ctx.header['access-control-allow-methods'] = 'Get'
    ctx.header['allow']
    ctx.body = JSON.stringify({status: 200, data: {
        ip: ip.address(),
        pid: process.pid, 
        host: os.hostname()
    }}) 
})

export default router

// // 自动丰富 response 相应头，当未设置响应状态(status)的时候自动设置，在所有路由中间件最后设置(全局，推荐)，也可以设置具体某一个路由（局部），例如：router.get('/index', router.allowedMethods()); 这相当于当访问 /index 时才设置
// app.use(router.allowedMethods())

// app.listen(3000, () => {
//   console.log('监听3000端口')
// })
