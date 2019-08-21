var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser');

var fs = require('fs');
const url = require("url");
var express = require("express")
var app = express();

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

let mydb, cloudant;
var vendor; // Because the MongoDB and Cloudant use different API commands, we
            // have to check which command should be used based on the database
            // vendor.
var dbName = 'hackday_db';

// Separate functions are provided for inserting/retrieving content from
// MongoDB and Cloudant databases. These functions must be prefixed by a
// value that may be assigned to the 'vendor' variable, such as 'mongodb' or
// 'cloudant' (i.e., 'cloudantInsertOne' and 'mongodbInsertOne')

var insertOne = {};
var getAll = {};

//
//app.post('/api/gdata', function(req, res) {
//
//var dataJson;
//try {
//   data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
//   var tempObj = {};
//   var tempObj2 = {};
//   for(var i = 0; i < data.length; i++){
//	   var d = data[i];
//	   
//	   var dtArr = d.toString().split(" ");
//	   var day = dtArr[0];
//	   var dObj = new Date(day);
//	   var month = dObj.getMonth() + 1;
//	   var day = dObj.getDate();
//	   var type = d[1]
//	   if(tempObj[type]){
//		   tempObj[type] += 1;
//	   }else{
//		   tempObj[type] = 1; 
//	   }
//	   if(tempObj2[month]){
//		   if(month){
//			   if(tempObj2[month][day]){
//				   tempObj2[month][day] += 1; 
//			   }else{
//				   tempObj2[month][day] = 1;
//			   }
//		   }
//	   }else{
//		   if(month){
//			   tempObj2[month] = {};
//			   if(tempObj2[month][day]){
//				   tempObj2[month][day] += 1; 
//			   }else{
//				   tempObj2[month][day] = 1;
//			   }
//		   }
//		   
//	   }
//	}
//   dataJson = {"lineData" : tempObj2, "barData" : tempObj}
//   res.send(dataJson);
//  return ;
////   console.log("Loaded local VCAP", dataJson);
//} catch (e) {
//	 res.send([]);
//   return ;
//}
//
//});



insertOne.cloudant = function(doc, response) {
  mydb.insert(doc, function(err, body, header) {
    if (err) {
      console.log('[mydb.insert] ', err.message);
      response.send("Error");
      return;
    }
    doc._id = body.id;
    response.send(doc);
  });
}

getAll.cloudant = function(response) {
  var names = [];  
  mydb.list({ include_docs: true }, function(err, body) {
    if (!err) {
      /*body.rows.forEach(function(row) {
        if(row.doc.name)
          names.push(row.doc.name);
      });*/

    	var data = body.rows;
    	var tempObj = {};
    	   var tempObj2 = {};
    	   for(var i = 0; i < data.length; i++){
    		   var d = data[i];
    		   
    		   var dtArr = d.doc.date.toString().split(" ");
    		   var day = dtArr[0];
    		   var dObj = new Date(day);
    		   var month = dObj.getMonth() + 1;
    		   var day = dObj.getDate();
    		   var type = d.doc.services
    		   if(tempObj[type]){
    			   tempObj[type] += 1;
    		   }else{
    			   tempObj[type] = 1; 
    		   }
    		   if(tempObj2[month]){
    			   if(month){
    				   if(tempObj2[month][day]){
    					   tempObj2[month][day] += 1; 
    				   }else{
    					   tempObj2[month][day] = 1;
    				   }
    			   }
    		   }else{
    			   if(month){
    				   tempObj2[month] = {};
    				   if(tempObj2[month][day]){
    					   tempObj2[month][day] += 1; 
    				   }else{
    					   tempObj2[month][day] = 1;
    				   }
    			   }
    			   
    		   }
    		}
    	   dataJson = {"lineData" : tempObj2, "barData" : tempObj}
    	
      response.json(dataJson);
    }
  });
  //return names;
}

let collectionName = 'mycollection'; // MongoDB requires a collection name.

insertOne.mongodb = function(doc, response) {
  mydb.collection(collectionName).insertOne(doc, function(err, body, header) {
    if (err) {
      console.log('[mydb.insertOne] ', err.message);
      response.send("Error");
      return;
    }
    doc._id = body.id;
    response.send(doc);
  });
}

getAll.mongodb = function(response) {
  var names = [];
  mydb.collection(collectionName).find({}, {fields:{_id: 0, count: 0}}).toArray(function(err, result) {
    if (!err) {
      result.forEach(function(row) {
        names.push(row.name);
      });
      response.json(names);
    }
  });
}



app.get('/', function(req, res) {
    res.render('demo', {
        title: "EJS example",
        header: "Some users",
//        data: JSON.stringify(dataJson)
    });
});
/* Endpoint to greet and add a new visitor to database.
* Send a POST request to localhost:3000/api/visitors with body
* {
*   "name": "Bob"
* }
*/
app.post("/api/visitors", function (request, response) {
  var userName = request.body.name;
  var doc = { "name" : userName };
  if(!mydb) {
    console.log("No database.");
    response.send(doc);
    return;
  }
  insertOne[vendor](doc, response);
});

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://localhost:3000/api/visitors
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */
app.get("/api/visitors", function (request, response) {

  var names = [];
  if(!mydb) {
    response.json(names);
    return;
  }
  getAll[vendor](response);
});

// load local VCAP configuration  and service credentials
var vcapLocal;
try {
//  vcapLocal = require('./vcap-local.json');
  vcapLocal = JSON.parse(fs.readFileSync('/app/vcap-local.json', 'utf8'));
  //import vcapLocal from ('./vcap-local.json')
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) {
    console.log(e);
}

const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}

const appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.services['compose-for-mongodb'] || appEnv.getService(/.*[Mm][Oo][Nn][Gg][Oo].*/)) {
  // Load the MongoDB library.
  var MongoClient = require('mongodb').MongoClient;

  dbName = 'hackday_db';

  // Initialize database with credentials
  if (appEnv.services['compose-for-mongodb']) {
    MongoClient.connect(appEnv.services['compose-for-mongodb'][0].credentials.uri, null, function(err, db) {
      if (err) {
        console.log(err);
      } else {
        mydb = db.db(dbName);
        console.log("Created database: " + dbName);
      }
    });
  } else {
    // user-provided service with 'mongodb' in its name
    MongoClient.connect(appEnv.getService(/.*[Mm][Oo][Nn][Gg][Oo].*/).credentials.uri, null,
      function(err, db) {
        if (err) {
          console.log(err);
        } else {
          mydb = db.db(dbName);
          console.log("Created database: " + dbName);
        }
      }
    );
  }

  vendor = 'mongodb';
} else if (appEnv.services['cloudantNoSQLDB'] || appEnv.getService(/[Cc][Ll][Oo][Uu][Dd][Aa][Nn][Tt]/)) {
  // Load the Cloudant library.
  var Cloudant = require('@cloudant/cloudant');

  console.log("Load the Cloudant library");

  // Initialize database with credentials
  if (appEnv.services['cloudantNoSQLDB']) {
    // CF service named 'cloudantNoSQLDB'
    cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
  } else {
     // user-provided service with 'cloudant' in its name
     cloudant = Cloudant(appEnv.getService(/cloudant/).credentials);
  }
} else if (process.env.CLOUDANT_URL){
  console.log("Load env.CLOUDANT_URL: " + process.env.CLOUDANT_URL);
  cloudant = Cloudant(process.env.CLOUDANT_URL);

}
if(cloudant) {
  //database name
  dbName = 'hackday_db';

  // Create a new "mydb" database.
  cloudant.db.create(dbName, function(err, data) {
    if(!err) //err if database doesn't already exists
      console.log("Created database: " + dbName);
  });

  // Specify the database we are going to use (mydb)...
  mydb = cloudant.db.use(dbName);

  vendor = 'cloudant';
}



//serve static file (index.html, images, css)
//app.use(express.static(__dirname + '/views'));



var port = process.env.PORT || 3000
app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});
