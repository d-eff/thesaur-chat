var request = require('request'),
    async = require('async'),
    mongo = require('mongodb'),
    monk = require('monk'),
    config = require('./config'),
    db = monk(config.dbURL + config.dbpath);

var collection = db.get(config.dbcollection);

var output = {};
var input = process.argv[2].split(' ');

function splitWordList(word, data, callback){
  var wordList = [];
  if(data.response){
  data.response.forEach(function(respo){
    respo.list.synonyms.split('|')
    .forEach(function(d){
      var w = d.split(' ');
        wordList.push(w[0]);
    })
  });
  } else {
    wordList.push(word);
  }
  var rand = Math.random()*wordList.length|0;
  console.log(wordList);
  var h = wordList[rand];
  if(h !== undefined){
    output[word] = h;
  }
  callback();
};

function getWord(word, callback){
  output[word] = word;
 collection.find({"term": "I"}, {}, function(e, docs){
   if(e){
    console.log("error " + e)
   } else {
    console.log(docs);  
    db.close();
   }
  });
  var url = "http://thesaurus.altervista.org/service.php?word="+word+"&language=en_US&output=json&key="+config.apiKey;

  request(url, function(error, response, body){
    if(!error && response.statusCode == 200){
      splitWordList(word, JSON.parse(body), callback);
      
    } else {
      console.log(error);
      callback();
    }
  });
}

async.each(input, getWord, function(err){
  if(err){
    console.log("problem");
  } else {
    var b = [];
    for(var x in output){
      b.push(output[x]);
    } 
    console.log(b.join(' '));
  }
});

