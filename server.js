var mysql      = require('mysql')
var express = require('express')
var bodyParser = require('body-parser')
var multer  = require('multer')

var fs = require("fs");
if (!fs.existsSync("images")){
  fs.mkdir("images",(r)=>{console.log(r)})
} else {
  console.log("path duplicate")
}

var db_config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nutcon_store'
};

var connection

function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.
  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000) // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  connection.on('error', function(err) {
    console.log('db error', err)
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err                                 // server variable configures this)
    }
  });
}

handleDisconnect()

var app = express()

// var http = require('http').Server(app)


// Create an instance of the http server to handle HTTP requests
// http.listen(7778, function(){
//       console.log('listening on *:7778')
// });

app.use(bodyParser.json())

var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
      callback(null, "pic_pro");
  },
  filename: function(req, file, callback) {
      callback(null, req.body.pic_name+ '.jpg');
  }
});
var upload = multer({
  storage: Storage
}).fields([{ name: 'pic_pro', maxCount: 1 }])

app.post("/insertPro",function(req,res){
  console.log(req.body)
  connection.query('insert into product (pro_name,cat_id,pro_description,detail_id) values("'+req.body.name+'","'+req.body.cat+'","'+req.body.des+'")', function(err, result) {
    if (!err){
      if(result.affectedRows){
        connection.query("SELECT AUTO_INCREMENT FROM  INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'nutcon_store' AND   TABLE_NAME   = 'product'", function(err, rows, fields) {
        if (!err){
          if(rows.length != 0){
            console.log(rows)
            // connection.query('insert into detail_product (det_color,det_size,det_price,det_quantity) values("'+req.body.pro_name+'")', function(err, result) {
            //   if (!err){
            //     if(result.affectedRows){
            //       res.json({status: "Success insertPro"})
            //     }
            //   }
            //   else {
            //     res.json({status: "Fail insertPro  insert 2"})
            //   }
            // });        
          }
        } else {
          res.json({status: "Fail insertPro  select 1"})
        }
      });        
    }
  } else {
      res.json({status: "Fail insertPro insert 1"})
    }
  });  
});

app.post("/getCat",function(req,res){
  console.log(req.body)
  connection.query("select cat_id,cat_name from category", function(err, rows, fields) {
    if (!err){
      if(rows.length != 0){
        console.log(rows)
        res.json({status: "Success getCat",catList: rows})
       
      }
    } else {
      res.json({status: "Fail getCat"})
    }
  });        
});

app.get("/",function(req,res){
  res.send('Hello World')
});
app.listen(7777);