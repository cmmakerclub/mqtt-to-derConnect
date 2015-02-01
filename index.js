var socket = require('socket.io-client');
var internalIp = require('internal-ip');
var publicIp = require('public-ip');
var mqtt    = require('mqtt');

var serial_number = 'CCC'; 
// var serial_number = fs.readFileSync("/proc/cpuinfo").toString().split("Serial\t\t: ")[1].trim() || "dummy-not-pi";

//var domain = "http://localhost:9000";
var domain = "https://derconnect.herokuapp.com";

//var mqttServer = "mqtt://localhost:1883";
var mqttServer = "mqtt://test.mosquitto.org";
var client  = mqtt.connect(mqttServer);

socket = socket.connect(domain, { path: '/socket.io-client', query: "from=raspberry&ble_scan=1&serial_number=" + serial_number });

client.subscribe('senser-data');

client.on('message', function (topic, message) {

  message = message.toString();
  message = JSON.stringify(eval('('+message+')'));
  message = JSON.parse(message);
  
  console.log(message);

  if (topic == 'senser-data') {
    if (checkProperty(message)) {
      // by pass all data to gateway derConnect
      socket.emit("pi:receive", message);  
    }
  }

});

socket.on('pi:action:temperature:' + serial_number, function (data) {
  console.log(data);
  
  // send action from server to those subscribe 
  client.publish('sensor-action', JSON.strify(data));

});

/*
  YES, format should be
  {
    uuid : 'xxxuuid',
    type : 'eg. tempurager'.
    data : 'Can be string or object'
  }
*/
var checkProperty = function (instance) {
  if (instance.hasOwnProperty('uuid') &&
      instance.hasOwnProperty('data') &&
      instance.hasOwnProperty('type')) {
    return true;
  }
  else {
    return false;
  }

}

// for special thgin (Ip and local ip)
setInterval(function() {

  publicIp(function (err, ip) {

    var sendIpData = 
    {
      type: "ip",
      data: internalIp()
    }

    socket.emit('pi:receive', sendIpData)

  });

  var sendLocalIpData = 
  {
    type: "localIp",
    data: internalIp()
  }

  socket.emit('pi:receive', sendLocalIpData)


}, 60000);





