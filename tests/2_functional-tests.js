/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

//in order for all the tests below to pass, need to ensure that database is empty at start of testing
//the reason is because once the functional tests run, the ip address gets stored and the number of likes will no longer increase

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      var stockLikes = 0;
      var newLikes = 0 ;
      var newLikes2 = 0 ;
      var secondStockLikes = 0 ;
      var secondNewLikes = 0 ;
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
           //console.log(res.body);
            //complete this one too
           assert.equal(res.status, 200)
           assert.property(res.body,'stockData','response object should contain stockData object');
           assert.property(res.body.stockData,'stock','stockData object should contain stock property');
           assert.property(res.body.stockData,'price','stockData object should contain price property');
           assert.property(res.body.stockData,'likes','stockData object should contain likes property');
           assert.equal(res.body.stockData.stock,'goog');
           assert.isNumber(res.body.stockData.price,'stock price');
           stockLikes = res.body.stockData.likes ;
           assert.isNumber(stockLikes,'stock likes');
           done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({stock: 'goog', like: 'true'})
          .end(function(err,res){
             assert.equal(res.status, 200)
             assert.property(res.body,'stockData','response object should contain stockData object');
             assert.property(res.body.stockData,'stock','stockData object should contain stock property');
             assert.property(res.body.stockData,'price','stockData object should contain price property');
             assert.property(res.body.stockData,'likes','stockData object should contain likes property');
             assert.equal(res.body.stockData.stock,'goog');
             assert.isNumber(res.body.stockData.price,'stock price');
             newLikes = res.body.stockData.likes
             assert.isNumber(newLikes,'stock likes');
             assert.isAbove(newLikes,stockLikes,'newLikes should be larger than stockLikes');
             assert.equal(newLikes,stockLikes+1) ;
             done();
          });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({stock: 'goog', like: 'true'})
          .end(function(err,res){
             assert.equal(res.status, 200)
             assert.property(res.body,'stockData','response object should contain stockData object');
             assert.property(res.body.stockData,'stock','stockData object should contain stock property');
             assert.property(res.body.stockData,'price','stockData object should contain price property');
             assert.property(res.body.stockData,'likes','stockData object should contain likes property');
             assert.equal(res.body.stockData.stock,'goog');
             assert.isNumber(res.body.stockData.price,'stock price');
             newLikes2 = res.body.stockData.likes
             assert.isNumber(newLikes2,'stock likes');
             assert.equal(newLikes,newLikes2) ;
             done();
          });
      });
      
      test('2 stocks', function(done) {
        chai.request(server)
          .get('/api/stock-prices?stock=goog&stock=amzn')
          .end(function(err,res){
            //console.log(res.body.stockData);
             assert.equal(res.status, 200)
             assert.property(res.body,'stockData','response object should contain stockData object');
             assert.isArray(res.body.stockData,'stockData object should be an array') ;
             assert.property(res.body.stockData[0],'stock','stockData object should contain stock property');
             assert.property(res.body.stockData[0],'price','stockData object should contain price property');
             assert.property(res.body.stockData[0],'rel_likes','stockData object should contain rel_likes property');
             assert.equal(res.body.stockData[0].stock,'goog');
             assert.equal(res.body.stockData[1].stock,'amzn');
             assert.isNumber(res.body.stockData[0].price,'stock price');
             secondStockLikes = res.body.stockData[1].rel_likes
             assert.isNumber(secondStockLikes,'second stock likes');
             assert.equal(secondStockLikes+res.body.stockData[0].rel_likes,0);
             done();
          });  
      });
      
      test('2 stocks with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices?stock=goog&stock=amzn&like=true')
          .end(function(err,res){
            assert.equal(res.status, 200)
             assert.property(res.body,'stockData','response object should contain stockData object');
             assert.isArray(res.body.stockData,'stockData object should be an array') ;
             assert.property(res.body.stockData[0],'stock','stockData object should contain stock property');
             assert.property(res.body.stockData[0],'price','stockData object should contain price property');
             assert.property(res.body.stockData[0],'rel_likes','stockData object should contain rel_likes property');
             assert.equal(res.body.stockData[0].stock,'goog');
             assert.equal(res.body.stockData[1].stock,'amzn');
             assert.isNumber(res.body.stockData[0].price,'stock price');
             secondNewLikes = res.body.stockData[1].rel_likes
             assert.isNumber(secondNewLikes,'second stock likes');
             assert.isAbove(secondNewLikes,secondStockLikes,'secondNewLikes should be larger than secondStockLikes');
             assert.equal(secondNewLikes,secondStockLikes+1) ;
             assert.equal(secondNewLikes+res.body.stockData[0].rel_likes,0);
             done();
          });
      });
      
    });

});
