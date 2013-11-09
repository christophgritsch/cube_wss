var WebSocketServer = require('websocket').server;
var req = require('request');
var http = require('http');

var clients = [];
var devices = [];

var server = http.createServer(function(request, response) {
	// Add devices, fetch from PHP-API!
});
server.listen(8999, function() {
	console.log("Server listening on Port *:8999");
});

wsServer = new WebSocketServer({
	httpServer : server
});

// setInterval(broadcastAllDevState, 2000);

wsServer.on('request', function(request) {
	var connection = request.accept(null, request.origin);

	var index = clients.push(connection) - 1;

	log("Connection accepted from " + connection.remoteAddress);

	connection.on('message', function(message) {
		if (message.type === 'utf8') {
			try {
				var m = JSON.parse(message.utf8Data);
				if (m.type == 'CC') {
					// Command from Client
					log("Client (" + connection.remoteAddress + "): "
							+ JSON.stringify(m));
					// Forward to PHP API
					// TODO: IMPLEMENT PHP API COM
				}
				if (m.type == 'SC') {
					// Command from Server
					log("Server (" + connection.remoteAddress + "): "
							+ JSON.stringify(m));
					// Forward to all connected Clients
					sendToAllClients(m.data);
				}
				// Request Device Count
				if (m.type == 'RC') {
					log("Client (" + connection.remoteAddress + "): "
							+ JSON.stringify(m));
					var out = JSON.stringify({
						type : 'DC',
						data : {
							count : devices.length
						}
					});
					sendToClient(connection, out);
					log("Sent to (" + connection.remoteAddress + "): " + out);
				}
				// Request Devices
				if (m.type == 'RQD') {
					log("Client (" + connection.remoteAddress + "): "
							+ JSON.stringify(m));
					for ( var i = 0; i < devices.length; i++) {
						connection.sendUTF(JSON.stringify({
							type : 'AD',
							data : devices[i]
						}));
					}
					log("Sent all available Devices to ("
							+ connection.remoteAddress + ")");
				}
				// Request Device Value
				if (m.type == 'RV') {
					log("Client (" + connection.remoteAddress + "): "
							+ JSON.stringify(m));
					sendSingleDevState(connection, request, m.data.devID);
				}
				// Add a Device
				if (m.type == 'AD') {
					// Add Device
					log("New Device: " + JSON.stringify(m));
					devices.push(m.data);
					// Send add cmd to all connected Clients
					sendToAllClients(m);
				}
				// Remove a Device
				if (m.type == 'RD') {
					// Remove Device
					// TODO: IMPLEMENT DEV REMOVING ALGORITHM
					// Send rmv cmd to all connected Clients
				}
			} catch (ex) {
			}
		}
	});

	connection.on('close', function(connection) {
		log("Connection closed from " + request.origin);
		clients.splice(index, 1);
	});
});

function broadcastAllDevState() {
	for ( var i = 0; i < devices.length; i++) {
		broadcastSingleDevState(i);
	}
}

function broadcastSingleDevState(didx) {
	req(r.origin + "/cube/api/?a=d&t=GET&a0=" + devid, function(error,
			res, body) {
		if (!error && res.statusCode == 200) {
			var json = JSON.stringify({
				type : 'DV',
				data : JSON.parse(body)
			});
			sendToClient(c, json);
			console.log("\t" + c.remoteAddress + "> " + json);
		}
	});
}

function sendAllDevState(c, r) {
	for ( var i = 0; i < devices.length; i++) {
		sendSingleDevState(c, r, devices[i].devID);
	}
}

function sendSingleDevState(c, r, devid) {
	req(r.origin + "/cube/api/?a=d&t=GET&a0=" + devid, function(error,
			res, body) {
		if (!error && res.statusCode == 200) {
			var json = JSON.stringify({
				type : 'DV',
				data : JSON.parse(body)
			});
			sendToClient(c, json);
			log("Sent to (" + c.remoteAddress + "): " + json);
		}
	});
}

function sendToClient(c, msg) {
	c.sendUTF(msg);
}

function sendToAllClients(msg) {
	for ( var i = 0; i < clients.length; i++) {
		clients[i].sendUTF(msg);
	}
}

function getDevAPosFromId(id) {
	for ( var i = 0; i < devices.length; i++) {
		if (devices[i].devID == id) {
			return i;
		}
	}
}

function log(txt) {
	var now = new Date();
	console.log("[" + now.getHours() + ":" + now.getMinutes() + ":"
			+ now.getSeconds() + "]" + ": " + txt);
}
