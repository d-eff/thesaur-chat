var request = require('request'),
    async = require('async'),
    mongo = require('mongodb'),
    monk = require('monk'),
    config = require('./config'),
    db = monk(config.dbURL + config.dbpath);

var collection = db.get(config.dbcollection),
    output = {},
    counter = 0;

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
  
  //if we had to fetch from the api, push the new term to the db
  //create the obj for the new word
  var newDBEntry = {
    term: word,
    synonyms:[]
  }

  //push each term in wordlist to the newDBEntry, with a default weight of 1
  for(var x = 0; x < wordList.length; ++x){
    var entryWord = {
      syn: wordList[x],
      weight: 1
    }
    newDBEntry.synonyms.push(entryWord);
  }
  
  //again, just in case
  if(h !== undefined){
    //push our new word to the DB so we don't have to hit the API for it again
    collection.insert(newDBEntry, function(e, docs){
      if(e){
        //console.log("error in insert " + e);
      }
    });

    //return the word
    return h;
  }


};

//this gets called for each word
//check local cache
//if not, check db (remote cache)
//if not, call api
//  if we call api, write data to local + remote caches
function getWord(word, callback){
  var result;

  //check the db
  collection.find({"term": word}, {}, 
  function(e, docs){
    if(e){
      //console.log("DB error " + e)
    } else {
      //we got a hit in the db
      if(docs.length > 0){
        //make an array to hold the weighted synonyms
        var weightedSyns = [],
            syns = docs[0].synonyms;
        
        //push each synonym to weightedArray once for each increment of weight
        for(var itr in syns){
          for(var ctr = 0; ctr < syns[itr].weight; ++ctr){
            weightedSyns.push(syns[itr].syn);
          }  
        }
        //return a (weighted) random synonym
        result = weightedSyns[Math.random()*weightedSyns.length|0];
        callback(null, result);
      } else {
        //if we didn't find it in the db, check api
        var url = "http://thesaurus.altervista.org/service.php?word="+word+"&language=en_US&output=json&key="+config.apiKey;
        request(url, function(error, response, body){
          if(!error && response.statusCode == 200){
            //we got a hit in the api 
            //we need to parse the api response
            result = splitWordList(word, JSON.parse(body));
            callback(null, result);
          } else {
            //nothing found, so we'll just use the word itself
            //console.log("API call error " + error);
            result = word;
            callback(null, result);
          }
        });//end api callback 
      }
    }
  });//end db callback
}

var xpo = {};

xpo.fancify = function(input, callback){
  input = input.split(' ');

  //split the sentence on spaces
  //async process each word
  async.map(input, getWord, function(err, results){
    if(err){
      //console.log("problem");
    } else {
      //we've got all the words, put them back together
      callback(results.join(' '));
    }
  });
};

db.close();
module.exports = xpo;
