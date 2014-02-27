var request = require('request'),
    async = require('async'),
    mongo = require('mongodb'),
    monk = require('monk'),
    config = require('./config'),
    db = monk(config.dbURL + config.dbpath);

var collection = db.get(config.dbcollection),
    localCache = {},
    output = {};
    //input = process.argv[2].split(' ');


//oh god, I don't remember how this thing works
function splitWordList(word, data){
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
  var h = wordList[rand];
  if(h !== undefined){
    output[word] = h;
  }
  collection.insert({"term":word, "synonyms":wordList}, function(e, docs){
    if(e){
      console.log("error in insert " + e);
    }
  });
   
  
};

//this gets called for each word
//check local cache
//if not, check db (remote cache)
//if not, call api
//  if we call api, write data to local + remote caches
function getWord(word, callback){
  output[word] = word;
  console.log("GETTING WORD");
  collection.find({"term": word}, {}, 
  function(e, docs){
    if(e){
      console.log("DB error " + e)
    } else {
      //we got a hit in the db
      if(docs.length > 0){
        output[word] = docs[0].synonyms[Math.random()*docs[0].synonyms.length|0];
        callback();
      } else {
        //if docs came back empty, check api
        console.log("checking API");
        var url = "http://thesaurus.altervista.org/service.php?word="+word+"&language=en_US&output=json&key="+config.apiKey;
        request(url, 
        function(error, response, body){
          if(!error && response.statusCode == 200){
            //we got a hit in the api 
            splitWordList(word, JSON.parse(body));
            
          } else {
            console.log("API call error " + error);
          }
          //async callback;
          callback();
        });//end api callback 
      }
    }
  });//end db callback
      
}

var xpo = {};

xpo.fancify = function(input, coilbuk){
  input = input.split(' ');
  output = {};
//split the sentence on spaces
//async process each word
async.each(input, getWord, function(err){
  if(err){
    console.log("problem");
  } else {
    var b = [];
    for(var x in output){
      b.push(output[x]);
    } 
    coilbuk(b.join(' '));
  }
});
};

  db.close();
module.exports = xpo;
