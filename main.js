const http = require("http");
const request = require('request');
const cron = require("node-cron");
//const merge = require("merge");

cron.schedule("* * * * *", function() {
  console.log("running a task every minute");
  getContromeData();
});


function getContromeData()
{
	var dataObject = [];
	var outsObject;
	var tempsObject;
	
	var url = "http://mycontrome.ddnss.de/";
	
	request(url + '/get/json/v1/2/outs', { json: true }, (err, res, outsObject) => {
	  if (err) { return console.log('error', err); }
	 
	  for (var i = 0; i < outsObject.length; i++) {
		  var floorObject = outsObject[i];
		  var floorId = floorObject.id;
		  var floorRooms = floorObject.raeume;
		  
		  for (var j = 0; j < floorRooms.length; j++) {
			var roomObject = floorRooms[j];
			var roomId = roomObject.id;
			var roomName = roomObject.name;
			
			var out = roomObject.ausgang;
			var outputId = Object.keys(out)[0]; // limit to one output per room
			var isHeating = out[outputId];
			
			dataObject[roomId] = {'roomId': roomId, 'isHeating': isHeating};
		  }
	  }
	  
	  
	  request(url + '/get/json/v1/2/temps', { json: true }, (err, res, tempsObject) => {
		  if (err) { return console.log('error', err); }
		  
		  
		  for (var i = 0; i < tempsObject.length; i++) {
			  var floorObject = tempsObject[i];
			  var floorId = floorObject.id;
			  var floorRooms = floorObject.raeume;
			  
			  for (var j = 0; j < floorRooms.length; j++) {
				var roomObject = floorRooms[j];
				var roomId = roomObject.id;
				var roomName = roomObject.name;
				var targetTemp = roomObject.solltemperatur;
				var currTemp = roomObject.temperatur;
				
				dataObject[roomId].currTemp = currTemp;
				dataObject[roomId].targetTemp = targetTemp;
				
			  }
		  }
		  
		  for (var n=0; n < dataObject.length; n++) {
			var data = dataObject[n];
			if (!data) {
				continue;
			}
			insertData(data.roomId, data.isHeating, data.currTemp, data.targetTemp); 
		  }
		  
		  
		  
		});	
	});	
}

getContromeData();

//getRoomOutputs();

http.createServer(function (request, response) {
   // Send the HTTP header 
   // HTTP Status: 200 : OK
   // Content Type: text/plain
   response.writeHead(200, {'Content-Type': 'text/plain'});
   
   // Send the response body as "Hello World"
   response.end('Hello World\n');
}).listen(8089);

// Console will print the message
console.log('Server running at http://127.0.0.1:8089/');





var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "controme"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  
  
  //insertData(1, 2, 125, 1, 10, 13);
});

function insertData(roomId, isHeating, currTemp, targetTemp)
{
  var tenantId = 1;
  var timestamp = Math.floor(Date.now() / 1000);
  var sql = "INSERT INTO data (tenant_id, room_id, timestamp, is_heating, curr_temp, target_temp) "+
    " VALUES (" + tenantId + ", " + roomId + ", " + timestamp + ", " + isHeating + ", " + currTemp+ ", " + targetTemp + ")";
  con.query(sql, function (err, result) {
	 console.log(err);
	 console.log("INSERT DATA:" + tenantId + ", " + roomId + ", " + timestamp + ", " + isHeating + ", " + currTemp+ ", " + targetTemp)
  });
};