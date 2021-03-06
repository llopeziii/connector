var rekwest = require('request');
var jade = require('jade');
var fs = require('fs');
var json2csv = require('json2csv');

console.log("Calling 'API'...");
var leApps = [];
getEm('/apps?limit=100');

function getEm(pathname) {
  console.log("Fetching " + pathname + "...");
  rekwest({url:'http://api.bluebuttonconnector.healthit.gov' + pathname, json:true}, function(err, response, body) {
    if (body && body.results) {
      // console.log(body.results);
      leApps = leApps.concat(body.results);
      if (body.meta.next) {
        getEm(body.meta.next);
      } else {
        buildEm(leApps);
      }
    } else {
      console.warn("PROBLEM CONNECTING TO API!");
      process.exit(1);
    }
  });
}

function buildEm(apps) {
  console.log("Building HTML files for " + apps.length + " apps...");
  var pg = 0;
  var pgSize = 6;
  var numApps = apps.length;
  var batches = [];

  for (var i = 0; i < numApps ; i++) {
    if (i%pgSize === 0) {
      pg ++;
      batches.push(apps.slice((pg-1)*pgSize,pg*pgSize));
    }
  }

  for (var j = 0; j<batches.length; j++) {
    var curBatch = batches[j];
    var html = jade.renderFile('src/jade/templates/_apps.jade', {pretty: true, appList:curBatch, page: j+1, totalPages:batches.length});
    fs.writeFileSync('public/apps-' + (j+1) + '.html', html);
    console.log("apps-" + (j+1) + " built.");
  }

  buildDataDumpFiles(apps);
}

function buildDataDumpFiles(apps){
  console.log("Saving JSON file...");
  fs.writeFileSync('public/data/apps.json', JSON.stringify(apps));
  console.log("Saving CSV file...");
  //get the field name
  var csvFields = [];
  for (var prop in apps[0]) {
    csvFields.push(prop);
  }

  json2csv({data: apps, fields: csvFields}, function(err, csv) {
    if (err) console.log(err);
    fs.writeFileSync('public/data/apps.csv', csv);
    console.log("DONE.");
    process.exit(0);
  });
}
