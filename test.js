var express = require('express');
var fs = require('fs');
var request = require('request');
var app = express();
var google = require('./lib/googleapis.js');
var customsearch = google.customsearch('v1');
var FuzzyMatching = require('fuzzy-matching');
var fs = require('fs');


app.get('/search', function(req, res) {

 fs.writeFile('out.txt', '', function(){console.log('clear file')})

  const CX = '009462381166450434430:ecyvn9zudgu';
  const API_KEY = 'AIzaSyCaz0M_9YOwDJAw5314VxBuJpErbuuQGts';

  LineByLineReader = require('line-by-line'),
    lr = new LineByLineReader('list.txt');

  lr.on('error', function(err) {
    // 'err' contains error object
    return console.log('An error occured on reading file', err);
  });

  lr.on('line', function(line) {

    var res = line.split(",");
    var personName = res[0];
    var companyName = res[1];
    
    // var res2 = name.split(' ');
    // var firstName = res2[0];
    // var lastName = res2[1];

    var SEARCH = personName + ' ' + companyName;
    var urls = {};
    var i = 0;

    customsearch.cse.list({
      cx: CX,
      q: SEARCH,
      auth: API_KEY
    }, function(err, resp) {
      console.log(personName, companyName);

      if (err) {
        return console.log('An error occured', err);
      }
      // Got the response from custom search
      console.log("urls total: " + resp.searchInformation.formattedTotalResults);

      fs.appendFile('out.txt',
        '\n contact from sugar: '+personName + ' , '+companyName + " \n"+
        "find urls total: " + resp.searchInformation.formattedTotalResults + "\n",
        function(err) {
          if (err) {
            console.log(err)
          }
        });

      if (resp.items && resp.items.length > 0) {
        var compareAll = [];

        var candidates = [];
        resp.items.forEach(function(item) {

          var linkedinName = item.title.split(' | ')[0];
          var fmLinkedName = new FuzzyMatching([personName]);
          console.log(fmLinkedName.get(linkedinName));
          if (fmLinkedName.get(linkedinName).distance > 0.55) {

            candidates.push(item);
          }
        }); //end of forEAch 

        if (candidates.length === 0) {
          fs.appendFile('out.txt',
            "no linkedin result found\n",
            function(err) {
              if (err) {
                console.log(err)
              }
            });
          return console.log('no linkedin result found');
        }

        var tobeCompared = {};
        var companyValues = [];
        var k = 0;
        // for (var item in candidates) {
        candidates.forEach(function(item) {
          //get its company rank
          //   console.log(item);
          var compare = [];
          var org = (item.pagemap === undefined || item.pagemap.person === undefined) ? undefined : JSON.stringify(item.pagemap.person[0].org);
          var role = (item.pagemap === undefined || item.pagemap.person === undefined) ? undefined : JSON.stringify(item.pagemap.person[0].role);
          //  var name = (item.pagemap === undefined || item.pagemap.hcard === undefined) ? undefined : JSON.stringify(item.pagemap.hcard[0].fn);
          var title = (item.pagemap === undefined || item.pagemap.hcard === undefined) ? undefined : JSON.stringify(item.pagemap.hcard[0].title);

          if (item.snippet !== undefined) {
            compare.push(item.snippet);
            // if (item.snippet.indexOf(companyName) !== -1) {}
          }
          if (title !== undefined) {
            compare.push(title);
            // if (title.indexOf(companyName) !== -1) {}
          }
          if (org !== undefined) {
            compare.push(org);
            //if (org.indexOf(companyName) !== -1) {}
          }
          if (role !== undefined) {
            compare.push(role);
            // if (role.indexOf(companyName) !== -1) { }
          }

          console.log(compare);
          //  var distance = 0;
          //pick the one with the highest score
          var highestValueForItem = '';
          if (compare.length > 0) {
            var fm = new FuzzyMatching(compare);
            highestValueForItem = fm.get(companyName).value;
            if (highestValueForItem !== null) {
              companyValues.push(highestValueForItem);
              tobeCompared[k++] = {
                url: item.link,
                companyValue: highestValueForItem
              };
            }

          }
        });

        if (companyValues.length === 0) {
          fs.appendFile('out.txt',
            "no result found\n",
            function(err) {
              if (err) {
                console.log(err)
              }
            });
          console.log('no result found');
        } else {
          var theURL = '';
          var fm2 = new FuzzyMatching(companyValues);
          var scoreValue = fm2.get(companyName).value;

          //get the score highest url
          for (var x in tobeCompared) {
            if (tobeCompared[x].companyValue === scoreValue) {
              theURL = tobeCompared[x].url;

            }
          }
          fs.appendFile('out.txt',
            "found url: " + theURL + "\n",
            function(err) {
              if (err) {
                console.log(err)
              }
            });
          console.log('found url: ', theURL);

        }
        //end of else

      }

    });

  });

  lr.on('end', function() {
    console.log('end of file');
    // All lines are read, file is closed now.
  });



  res.send('Check your console!')

})

app.listen('8081')
console.log('run on port 8081');
exports = module.exports = app;