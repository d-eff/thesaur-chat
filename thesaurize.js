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

//TODO: GET A NEW API
function splitWordList(word, data){
  
  var wordList = [];
  
  //API response is: {response: {list: {synonyms: "syn1|syn2|..."}}}
  //I don't know why.
  if(data.response){
  data.response.forEach(function(respo){
    respo.list.synonyms.split('|')
    .forEach(function(d){
      //sometimes the response terms are: syn1 (similar term)
      //this just discards anything funky after the term
      var w = d.split(' ');
        wordList.push(w[0]);
    })
  });
  } else {
    //this never fires, because we catch the error in getWord
    //and never call splitWordList, but just to be safe
    wordList.push(word);
  }
  var rand = Math.random()*wordList.length|0;
  var h = wordList[rand];

  //again, just in case
  if(h !== undefined){
    output[word] = h;
  }

  //if we had to fetch from the api, push the new term to the db
  collection.insert({"term":word, "synonyms":wordList}, function(e, docs){
    if(e){
      console.log("error in insert " + e);
    }
  });
};

//TODO: Add local cache
//this gets called for each word
//check local cache
//if not, check db (remote cache)
//if not, call api
//  if we call api, write data to local + remote caches
function getWord(word, callback){
  //sets the word as a property of the output obj
  //initially output was an array, but the callbacks don't
  //always fire in order - making it an obj allows us to preserve that
  output[word] = word;

  //check the db
  collection.find({"term": word}, {}, 
  function(e, docs){
    if(e){
      console.log("DB error " + e)
    } else {
      //we got a hit in the db
      if(docs.length > 0){
        //get a random synonym
        output[word] = docs[0].synonyms[Math.random()*docs[0].synonyms.length|0];
        callback();
      } else {
        //if we didn't find it in the db, check api
        var url = "http://thesaurus.altervista.org/service.php?word="+word+"&language=en_US&output=json&key="+config.apiKey;
        request(url, function(error, response, body){
          if(!error && response.statusCode == 200){
            //we got a hit in the api 
            //we need to parse the api response
            splitWordList(word, JSON.parse(body));
            
          } else {
            //nothing found, so we'll just use the word itself
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

//TODO: remove (and add back) punctuation
//TODO: tolowercase everything before sending it to getWord
xpo.fancify = function(input, coilbuk){
  input = input.split(' ');
  output = {};
//split the sentence on spaces
//async process each word
async.each(input, getWord, function(err){
  if(err){
    console.log("problem");
  } else {
    //we've got all the words, put them back together
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
