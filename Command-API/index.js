const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);


io.on('connection', (socket) => {
    console.log('Client has connected with Socket.io')
})

app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.post('/speak', (req, res) => {
    req.on("data", (chunk)=> {
        const text = JSON.parse(chunk).message;
        console.log(text)
        io.emit('speak', text);
        res.sendStatus(200);
    })
   
});

app.get('/forward', (req, res) => {
    io.emit('forward');
    res.sendStatus(200);

})

app.get('/backward', (req, res) => {
    io.emit('backward');
    res.sendStatus(200);

});

app.get('/left', (req, res) => {
    io.emit('left');
    res.sendStatus(200);

});

app.get('/right', (req, res) => {
    io.emit('right');
    res.sendStatus(200);

})

app.get('/shoot', (req, res) => {
    io.emit('shoot');
    res.sendStatus(200);

})

app.get('/stay', (req,res)=> {
    io.emit('stop');
    res.sendStatus(200);
})

http.listen(4000, () => {
    console.log("Server initialized @4000");
});

