const express = require('express');
const bodyParser = require('body-parser');
const googleSheets = require('gsa-sheets');

const key = require('./privateSettings.json');

// TODO(you): Change the value of this string to the spreadsheet id for your
// GSA spreadsheet. See HW5 spec for more information.
const SPREADSHEET_ID = '199i-uNwYF48_hoyLBeXekyyaHYWZ17tNfzUmZRlm21A';

const app = express();
const jsonParser = bodyParser.json();
const sheet = googleSheets(key.client_email, key.private_key, SPREADSHEET_ID);

app.use(express.static('public'));

async function onGet(req, res) {
  const result = await sheet.getRows();
  const rows = result.rows;

  // TODO(you): Finish onGet.
  let objString = '[';
  let cName = [];
  let cCount = 0;
  for(let r of rows[0]){
    cName.push(r);
    cCount++;
  }
  for(let i=1;i<rows.length;i++){
    objString+='{';
    for(let j=0; j<cCount; j++){
      let t = rows[i][j];
      objString +='\"' + rows[0][j] + '\"' + ':' + '\"'+ t +'\"';
      if(j!==cCount-1){
        objString+=',';
      }
    }
    objString+='}';
    if(i!==rows.length-1){
      objString+=',';
    }
  }
  objString = objString + ']';
  const objs = JSON.parse(objString);
  res.json(objs);
}
app.get('/api', onGet);

async function onPost(req, res) {
  const messageBody = req.body;
 
  // TODO(you): Implement onPost.
  const result = await sheet.getRows();
  const rows = result.rows;
  let toPush = [];
  for(let r of rows[0]){
    for(let m in messageBody){
      if(r.toLowerCase()===m.toLowerCase()){
        toPush.push(messageBody[m]);
      }
    }    
  }
  await sheet.appendRow(toPush);
  res.json( { "response": "success" } );
}
app.post('/api', jsonParser, onPost);

async function onPatch(req, res) {
  const column  = req.params.column.toLowerCase();
  const value  = req.params.value.toLowerCase();
  const messageBody = req.body;
  
  // TODO(you): Implement onPatch.
  const result = await sheet.getRows();
  const rows = result.rows;
  let cNum = null;
  let rNum = null;
  let cName = [];
  let i = 0;
  //find out which row to change
  for(let r of rows[0]){
    cName.push(r.toLowerCase());
    if(column===r.toLowerCase()){
      cNum = i;
    }
    i++;
  }
  for(i=0; i<rows.length; i++){
    if(rows[i][cNum].toLowerCase()===value){
      rNum = i;
      break;
    }
  }
  //if row number is not null -> update
  if(rNum!==null){
    //change
    let tRow = rows[rNum];
    for(let m in messageBody){
      let t = cName.indexOf(m.toLowerCase());
      tRow[t] = messageBody[m];
    }
    await sheet.setRow(rNum,tRow);
  }
  res.json( { "response": "success" } );
}
app.patch('/api/:column/:value', jsonParser, onPatch);

async function onDelete(req, res) {
  const column  = req.params.column.toLowerCase();
  const value  = req.params.value.toLowerCase();

  // TODO(you): Implement onDelete.
  const result = await sheet.getRows();
  const rows = result.rows;
  let cNum = null;
  let rNum = null;
  let i = 0;
  for(let r of rows[0]){
    if(column===r.toLowerCase()){
      cNum = i;
      break;
    }
    i++;
  }
  for(i=0; i<rows.length; i++){
    if(rows[i][cNum].toLowerCase()===value){
      rNum = i;
      break;
    }
  }
  if(rNum !== null){
    sheet.deleteRow(rNum);
  }
  res.json( { "response": "success"} );
}
app.delete('/api/:column/:value',  onDelete);


// Please don't change this; this is needed to deploy on Heroku.
const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Server listening on port ${port}!`);
});
