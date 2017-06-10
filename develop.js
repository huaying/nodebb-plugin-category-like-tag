
var db = require.main.require('./src/database');
var async = require('async');
var categories = require.main.require('./src/categories');
var utils = require.main.require('./src/utils');
var meta = require.main.require('./src/meta');
var topics = require.main.require('./src/topics');


var disableCategories = function(cids) {
  cids.forEach(function(cid) {
    db.setObjectField('cid:' + cid, 'disabled', 1);
  });
}

var createCategoryLikeTag = function(c) {
  var key = 'cid:' + c.parentCid + ':tags';
  console.log(key);
  async.waterfall([
    function (next) {
      db.isSortedSetMember(key, c.tag, next)
    },
    function (isMember, next) {
      if (isMember) {
        return next();
      }
      db.sortedSetAdd(key, Date.now(), c.tag, next);
    }
  ]);
}

var migrate = function(cid) {
  async.waterfall([
    async.apply(db.getSortedSetRange, 'cid:' + cid + ':children', 0, -1),
    function (cids, next) {
      // disable category
      disableCategories(cids);
      categories.getCategoriesFields(cids, [], next);
    },
    function(data, next) {
      data.forEach(function(c) {
        c.tag = utils.cleanUpTag(c.name, meta.config.maximumTagLength);

        // create the normal link using category name
        topics.createEmptyTag(c.tag);
        // create custom tag
        createCategoryLikeTag(c);
      });
    }
  ]);
}

var dev = function() {
  var excuted_cid = 5;
  migrate(excuted_cid);

  // async.waterfall([
  //   function (next) {
  //     db.isSortedSetMember('category:1000:tags', 'google', next)
  //   },
  //   function (isMember, next) {
  //     if (isMember) {
  //       return next();
  //     }
  //     console.log(123)
  //     db.sortedSetAdd('category:1000:tags', Date.now(), 'google', next)
  //   }
  // ])
  // db.sortedSetRemove('category:1000:tags', 'google', null);
  // db.delete('category:1000:tags')
}
module.exports = dev;
