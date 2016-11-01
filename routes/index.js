var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
//  res.render('index', { title: 'IPTC PMD by ET' });
  // res.render('testlist1', { title: 'IPTC PMD by ET', theList: ['value 1|a', 'value 2|b', 'value3|c'] });
  // res.sendfile(__dirname + '/../public/getpmd.html');
  res.redirect('/getpmd.html');
});

module.exports = router;
