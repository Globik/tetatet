var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


http.listen(3000, function(){
  console.log('listening on *:3000');
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected' + socket.id);
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});


io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
  });
});


io.on('connection', function(socket){
  socket.on('chat message', function(msg2){
    io.emit('chat message', msg2);
    console.log('emit message: ' + msg2);
  });
});

io.on('connection', function(socket){
    socket.on('chat member gender', function(user){
    console.log('gender: ' + user[0] + " age: " + user[1] + " socket_id: " + socket.id);
  });
});



var users = {};

io.on("connection", function(socket) {

		// Желание нового пользователя присоединиться к комнате
		socket.on("room", function(message) {
			var json = JSON.parse(message);
			// Добавляем сокет в список пользователей
			users[json.id] = socket;

			console.log('пользователь добавлен в массив');

			if (socket.room !== undefined) {
				// Если сокет уже находится в какой-то комнате, выходим из нее
				socket.leave(socket.room);
			}
			// Входим в запрошенную комнату
			//socket.room = json.room;
			socket.room = "PurpleOctopusRoom";
			socket.join(socket.room);
			socket.user_id = json.id;

			console.log('пользователь добавлен в комнату ' + socket.room);


			// Отправялем остальным клиентам в этой комнате сообщение о присоединении нового участника/
			socket.broadcast.to(socket.room).emit("new", json.id);
			
		});


// Сообщение, связанное с WebRTC (SDP offer, SDP answer или ICE candidate)
		socket.on("webrtc", function(message) {

			console.log('сообщение от webrtc ');
			var json = JSON.parse(message);
			if (json.to !== undefined && users[json.to] !== undefined) {
				// Если в сообщении указан получатель и этот получатель известен серверу, отправляем сообщение только ему...
				users[json.to].emit("webrtc", message);
				console.log('emit webrtc получатель известен серверу' + json.to + " from " + json.from);
			} else {
				// ...иначе считаем сообщение широковещательным
				socket.broadcast.to(socket.room).emit("webrtc", message);
				console.log('emit webrtc считаем сообщение широковещательным');
			}
		});

});


