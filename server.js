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
  connection = mysql.createConnection(db_config)

  connection.connect(function(err) {
    if(err) {
      console.log('error when connecting to db:', err)
      setTimeout(handleDisconnect, 2000) 
    }
  }); 
  connection.on('error', function(err) {
    console.log('db error', err)
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();     
    } else {                    
      throw err                                 
    }
  });
}

handleDisconnect()

var app = express()


app.use(bodyParser.json())

var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
      callback(null, "images");
  },
  filename: function(req, file, callback) {
      callback(null, req.body.picName+ '.jpg');
  }
});
var upload = multer({
  storage: Storage
}).fields([{ name: 'photo', maxCount: 1 }])
app.post("/uploadPic",function(req,res){
  upload(req, res, function(err) {
    console.log("upload")
    res.end("Upload Success");
    if (err) {
      console.log(err)
        return res.end("Something went wrong!");
    }
  })
})
app.post("/insertCat",function(req,res){
  connection.query("select cat_name,cat_id from category where cat_name = '"+req.body.catName+"'", function(err, rows, fields) {
    if (!err){
      console.log(rows)
      if(rows.length == 0){
        connection.query("SELECT AUTO_INCREMENT FROM  INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'nutcon_store' AND   TABLE_NAME   = 'category'", function(err, rows, fields) {
          if (!err){
            if(rows.length != 0){
              let cat_id = rows[0].AUTO_INCREMENT
              connection.query('insert into category (cat_name) values("'+req.body.catName+'")', function(err, result) {
                if (!err){
                  if(result.affectedRows){
                    res.json({toppic:"category insert", status: true, cat_id:cat_id})
                  }
                } else {
                  res.json({toppic:"category insert", status: false})
                }
              })      
            }
          }
        })
      } else {
        console.log(rows[0].cat_id)
        res.json({toppic:"category not insert", status: true, catId: rows[0].cat_id})
      }
    } else {
      res.json({status: "Fail getCat"})
    }
  });        
})

app.post("/insertPro",function(req,res){

  function callback () { res.json({status: "Success insertPro"}) }

  var itemsProcessed = 0;
  console.log(req.body)
  connection.query('insert into product (pro_name,cat_id,pro_description,pro_pic) values("'+req.body.name+'","'+req.body.cat+'","'+req.body.des+'","'+req.body.namePic+'")', function(err, result) {
    if (!err){
      if(result.affectedRows){
        connection.query("SELECT AUTO_INCREMENT FROM  INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'nutcon_store' AND   TABLE_NAME   = 'product'", function(err, rows, fields) {
        if (!err){
          if(rows.length != 0){
            let pro_id = rows[0].AUTO_INCREMENT-1
            if(req.body.proDetail.txtNum != undefined){
              req.body.proDetail.forEach(element => {
                connection.query('insert into detail_product (det_color,det_size,det_price,det_quantity,pro_id) values("'+element.txtColor+'","'+element.txtSize+'","'+element.txtPrice+'","'+element.txtNum+'","'+pro_id+'")', function(err, result) {
                  if (!err){
                    if(result.affectedRows){
                      itemsProcessed++;
                      if(itemsProcessed === req.body.proDetail.length) {
                        callback()
                      }
                    }
                  }
                  else {
                    console.log(err)
                  }
                }); 
              });
            } else {
              callback()
            }      
          }
        } else {
          res.json({status: "Fail insertPro  select 1"})
        }
      });        
    }
  } else {
      res.json({status: "Fail insertPro insert 1"})
      console.log("Fail insertPro insert 1")
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