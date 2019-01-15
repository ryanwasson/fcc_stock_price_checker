/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var mongoose = require('mongoose');
const request = require('request');

const CONNECTION_STRING = process.env.DB; 
mongoose.connect(CONNECTION_STRING);

//define schema
let stockSchema = mongoose.Schema({
  stock: String,
  ipAddresses: [String]
});

let StockTicker = mongoose.model('StockTicker',stockSchema,'StockTickers');

function getDataFromApi(stock, done) {
  request('https://api.iextrading.com/1.0/stock/'+stock+'/book', function (error, response, body) {
        if (!error && response.statusCode == 200) {
          let data = JSON.parse(body).quote ;
  
          return done(null,data) ;
        }
    
      else return done(error) ;
  });
}

function getStockFromDB(stock,like,ipAddress,data,done) {
  StockTicker.findOne({stock: stock}, function (err,doc) {

    if (err) return done(err) ;

    else if (doc == undefined) {// create new

      //define properties to use in constructor
      let stockProperties = {stock: stock, 
                             ipAddresses: []} ;
      
      if (like == 'true') stockProperties.ipAddresses.push(ipAddress) ;

      let newStock = new StockTicker(stockProperties) ;  //declare new stock object
      //console.log('newStock = '); console.log(newStock); console.log([ipAddress]);

      newStock.save(function(err,doc){ // save new stock object
        if (err) return done(err); 
        else return done(null,{stock: stock, 
                               price: data.latestPrice, 
                               likes: doc.ipAddresses.length});
      });
    }
    else {
      if (like == 'true') {//need to add ip address to saved stockTicker in db
        if (doc.ipAddresses.indexOf(ipAddress) == -1) {
          doc.ipAddresses.push(ipAddress) ;
          doc.save(function(err,doc) {//save modified object
            if (err) return done(err);
            else return done(null,{stock: stock, 
                                   price: data.latestPrice, 
                                   likes: doc.ipAddresses.length});
          });
        }
        else return done(null,{stock: stock, 
                               price: data.latestPrice, 
                               likes: doc.ipAddresses.length});

      }
      else return done(null,{stock: stock, 
                             price: data.latestPrice, 
                             likes: doc.ipAddresses.length});
    }
  });
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      //console.log('get');
      if (req.query.stock == undefined) return res.json({error: 'invalid api call'});
    
      else {
        let stock = req.query.stock ;
        let like = req.query.like ;
        //console.log(stock instanceof Array) ;
        //console.log('like = ' + like);
        
        
        var ipAddress = '' ;
        
        //in most cases, the ip address is stored in x-forwarded-for
        if (req.headers['x-forwarded-for'] != undefined) ipAddress = req.headers['x-forwarded-for'].split(',')[0];
        
        //but during functional tests, x-forwarded-for is undefined. In this case, use the 'host' property instead
        else ipAddress = req.headers['host'].split(':')[0] ;
        
        //console.log(ipAddress) ;
        
        //only one stock to look up
        if (!(stock instanceof Array)) {
          getDataFromApi(stock,function(error,data) {
            if (error) return res.json({error: error}) ;
            else {
              getStockFromDB(stock,like,ipAddress,data,function(error,stockData) {
                if (error) return res.json({error:error}) ;
                else return res.json({'stockData': 
                                        {stock: stockData.stock, 
                                         price: stockData.price, 
                                         likes: stockData.likes}
                                     });
              });
            }
          });
        }
        // multiple stocks to look up and compare
        else if (stock.length == 2) {
          getDataFromApi(stock[0],function(error,data0) {
            if (error) return res.json({error: error}) ;
            else {
              getStockFromDB(stock[0],like,ipAddress,data0,function(error,stockData0) {
                if (error) return res.json({error:error}) ;
                else {
                  getDataFromApi(stock[1],function(error,data1) {
                    if (error) return res.json({error: error}) ;
                    else {
                      getStockFromDB(stock[1],like,ipAddress,data1,function(error,stockData1) {
                        if (error) return res.json({error:error}) ;
                        else {
                          return res.json({'stockData': 
                                             [{stock: stockData0.stock,
                                               price: stockData0.price,
                                               rel_likes: stockData0.likes - stockData1.likes},
                                              {stock: stockData1.stock,
                                               price: stockData1.price,
                                               rel_likes: stockData1.likes - stockData0.likes}
                                             ]
                                          }) ;
                        }
                      });
                    }
                  });
          
          
                }
              });
            }
          });
        }
        
        else return res.json({error: 'You cannot compare more than two stocks at a time'});
        
      }
    
      
    });
    
};

