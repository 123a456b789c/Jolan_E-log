const {app, BrowserWindow, Menu} = require('electron');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const express = require('express');
var pdf = require('html-pdf');
const open = require('open');
const publicIp = require('public-ip');
const geoip = require('geoip-lite');
const xml2js = require('xml2js')
var fs = require('fs');
const server = express();
var cors = require('cors');
server.use(require('body-parser').urlencoded({ extended: false }));
let mainWindow
const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig')
var callbook = require('./convertcsv.json');
const db = new JsonDB(new Config("db.json", true, false, '/'));

  async function createWindow () {
    mainWindow = new BrowserWindow({autoHideMenuBar: true, icon: __dirname + '/icon.ico'})
    mainWindow.setTitle("Jolán E-Log");
    mainWindow.loadURL('file://' + __dirname + '/index.html')
    mainWindow.setMinimumSize(1280, 700)
    //mainWindow.webContents.openDevTools()
    //titleBarStyle: 'hidden',  titleBarOverlay: { color: '#212529', symbolColor: '#ffffff' }
  }


  server.post("/", function(req, res) {
    db.push("/qsl[]", {"dur": req.body.dur, "time": req.body.time, "call": req.body.call, "frequency": req.body.freq, "mode": req.body.mode, "rst": parseInt(req.body.rst)});
    res.send('OK')
  });

  server.post("/delete", function(req, res) {
    db.delete(`/qsl[${req.body.id}]`)
    res.send('OK')
  });

  server.post("/qsl", function(req, res) {

    var html = `<!DOCTYPE html><html><head></head><body style="  display: flex; justify-content: center;"><h1> QSL lap</h1>    <table style="border-style: solid;">        <tr>          <th>Hívójel</th>          <th>Rögzítve</th>          <th>Időtartam</th>          <th>Mód</th>          <th>RST</th>        </tr>        <tr>          <td><strong>${req.body.call}</strong></td>          <td>${req.body.time}</td>          <td>${req.body.dur} perc</td>          <td>${req.body.mode}</td>          <td>${req.body.rst}</td>        </tr>      </table></body></html>`
    
    const now = new Date()
    var time = now

    var options = { format: 'Letter' };
    pdf.create(html, options).toFile(`./${req.body.time.replace(/[/:,]/g,'')}-${req.body.mode}-QSL.pdf`, function(err, res) {
    if (err) return console.log(err);
    open(res.filename);
});  
});
  
  
  server.post("/search", async function(req, res) {
  var results = [];
  var searchField = "G";
  var searchVal = req.body.query;
  for (var i=0 ; i < callbook.length ; i++)
  {
    if (callbook[i][searchField] == searchVal) {
      res.send(callbook[i])
    }
  }
  res.send('NOINDEX')

  });
  
    

  server.get("/", function(req, res) {
    var data = db.getData("/qsl");
    res.send(data)
  });

  server.get("/weather", function(req, res) {
    var url = "https://www.hamqsl.com/solarxml.php";

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    
    xhr.onreadystatechange = function () {
       if (xhr.readyState === 4) {
        let rawxml = xhr.responseText.replace(/Good/g,'Jó').replace(/Fair/g,'Közepes').replace(/Poor/g,'Rossz')
        xml2js.parseString(rawxml, function (err, results) {
          let data = JSON.stringify(results)
          res.send(data)
          });
       }};
    
    xhr.send();


  });
  

  
  

  app.on('ready', createWindow)
  server.listen(433);
  