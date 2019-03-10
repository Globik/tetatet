var express=require('express');
var app = express();

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
 
const server = new https.createServer({
  cert: fs.readFileSync('/home/a0281868/domains/tetatetme.ru/tetatetme.crt'),
  key: fs.readFileSync('/home/a0281868/domains/tetatetme.ru/private.key')
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

const wss = new WebSocket.Server({ server });

/*
wss.on('connection', function open(ws) {
    console.log('Законектился один пользователь');
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
 
    ws.send('Это пришло SDP с сервера');
  
    ws.on('close', function close() {
        console.log('Пользователь отключился');
    })
});*/



server.listen(3000, function(){
  console.log('listening on *:3000');
});

// Переменные и массивы для работы с ними ниже
var offerSdp = [];
var offerId = [];
var answerSdp = [];
var answerId = [];




//КОД АЛИКА
wss.on('connection', function(ws){
	console.log("websocket connected!")
	ws.on('message', function(data){
		var msg = JSON.parse(data);
		
		// Проверяем есть ли в массиве сервера - Оферы
		if(msg.message_type === 'do_we_have_offer_on_server') {
		    
		    //Если есть - отправляем "Есть" + SDP, ID этого офера (ПОКА ТОЛЬКО ОДНОГО)
		    if(offerId.length>0) {
		        ws.send(JSON.stringify({message_type:'Offers online', offerSdp: offerSdp[0], offerId: offerId[0]}));
		    } //Если нет - отправляем "Нет", чтобы стать офером на клиенте
		    else {
		        ws.send(JSON.stringify({message_type:'No offer'}));
		    }
		    
		};
		
		
		// Если получили сообщение о том, что присоединился новый ОФЕР - добавили его в массив
		if(msg.message_type === 'I am offer') {
		    offerId.push(msg.user_id);
		    offerSdp.push(msg.sdp);
		    //ws.send(JSON.stringify({message_type:'No offer'}));
		}
		
		// Получили сообщение - что ANSWER дал ответ и добавили его SDP в массив
		if(msg.message_type === 'I am answer') {
		    answerId.push(msg.answerId);
		    answerSdp.push(msg.answerSdp);
		    //console.log("ANSWER SDP ПРИЛЕТЕЛ" + msg.answerSdp.sdp);
		    ws.send(JSON.stringify({
		        message_type:'Answer for offer',
		        answerId: msg.answerId,
		        answerSdp: msg.answerSdp,
		        offerId: msg.offerId
		    }));
		    
		}
		   
		   // Если получает КАНДИДАТЫ - отправляем весь сокет всем 
		  if(msg.message_type=="candidate-answer") {
		        console.log('ПОЛУЧИЛИ КАНДИДАТА АНСВЕРА  ' + data.candidate);
		        ws.send(data);
		  }
		  
		  if(msg.message_type=="candidate-offer") {
		      console.log('ПОЛУЧИЛИ КАНДИДАТА ОФРЕА  ' + data.candidate);
		        ws.send(data);
		        
		         
		  }
		  
		  console.log('msg.message_type  ' + msg.message_type);
		
	
	
	//	console.log("on message!" + data);
	//	wss.clients.forEach(function(client){
	//	if(client !==ws && client.readyState===WebSocket.OPEN)client.send(data)	
	//	})
		//ws.send(data);

	})	
	ws.on('close', function(){console.log("Websocket disconnected!")})
	ws.on('error', function(error){console.log("Websocket error\n", error);})
})

    


/*const fs = require('fs');
var app = require('express')();
var https = require('https').Server(app);

//var options = {
//  key: fs.readFileSync('./private.key'),
//  cert: fs.readFileSync('./file.crt')
//};

var server = https.createServer(app);
var io = require('socket.io')(https);
//var io = require('socket.io').listen(server);

server.listen(3000, function(){
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
*/

