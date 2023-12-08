// Call all library
const cors = require('cors')
const express = require('express')
const mongoose = require('mongoose')
const app = express()
const path = require('path')
const dotenv = require('dotenv')
dotenv.config();

// 3 on use start (cors, express.json(), bodyParser.urlencoded)
app.use(cors())

// Get variable environment
const portServer = process.env.PORT_SERVER_RUNNING

// Connected on database ft mongodb
mongoose.connect(process.env.URL_MONGOOSE, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log('Successfully connect on database')
})
.catch((error) => {
    console.log(error)
})

// Middleware untuk mengatur timeout
app.use((req, res, next) => {
    res.setTimeout(20000, () => {
        res.status(408).send('Request timeout');
    });
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Routers
const checkToken = require('./src/middlewares/verifyToken')
const requestRouter = require('./src/routes/requestRouters')
const shopRouter = require('./src/routes/shopRouters')
const productRouter = require('./src/routes/productRouters')
const accountRouter = require('./src/routes/accountRouters')
const historyRouter = require('./src/routes/historyRouters')
const subscribeRouter = require('./src/routes/subscribeRouters')
const paymentRouter = require('./src/routes/paymentRouters')
const revenueRouter = require('./src/routes/revenueRouters')

app.use('/account', accountRouter)
app.use('/request', checkToken, requestRouter)
app.use('/shop', checkToken, shopRouter)
app.use('/product', checkToken, productRouter)
app.use('/history', checkToken, historyRouter)
app.use('/subscribe', checkToken, subscribeRouter)
app.use('/payment', paymentRouter)
app.use('/revenue', revenueRouter)

app.get('/test', (req, res) => {
    res.send('test success!')   
})

// Running test
app.listen(portServer,() => {
    console.log(`Running on port ${portServer}`)
})