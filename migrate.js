
var db = require.main.require('./src/database');
var async = require('async');
var categories = require.main.require('./src/categories');
var utils = require.main.require('./src/utils');
var meta = require.main.require('./src/meta');
var topics = require.main.require('./src/topics');

var migrate = {}
migrate.disableCategories = function(cids) {
  // console.log('disable subcategories');
  cids.forEach(function(cid) {
    db.setObjectField('category:' + cid, 'disabled', 1);
  });
}

migrate.enableCategories = function(cids) {
  // console.log('disable subcategories');
  cids.forEach(function(cid) {
    db.setObjectField('category:' + cid, 'disabled', 0);
  });
}

migrate.createCategoryLikeTag = function(c, next) {
  // console.log('create custom tag structure: ' + c.cid);
  async.waterfall([
    function (next) {
      categories.getAllTopicIds(c.cid, 0, -1, next);
    },
    function (topicIds, next) {
      var data = {
        tag: c.tag,
        topicIds: topicIds
      };
      db.setObject('cid:' + c.cid + ':custom_tag', data, next);
    }
  ], next);
}


migrate.addCustomTagToTopics = function(c, next) {
  // console.log('add custom tag to topics: ' + c.cid);
  async.waterfall([
    function (next) {
      categories.getAllTopicIds(c.cid, 0, -1, next);
    },
    function (topicIds, next) {
      async.each(topicIds, function(tid, next) {
        topics.createTags([c.tag], tid, Date.now(), next);
      }, next);
    }
  ], next);
}

migrate.moveTopicToParentCategory = function(c, parentCid, next) {
  // console.log('move topic to parent\'s category: ' + c.cid);
  async.waterfall([
    function (next) {
      categories.getAllTopicIds(c.cid, 0, -1, next);
    },
    function (tids, next) {
      async.each(tids, function(tid, next) {
        topics.setTopicField(tid, 'cid', parentCid, next);
      }, next);
    }
  ], next);
};

migrate.recoverMoveTopicToParentCategory = function(c, next) {
  // console.log('recover starts: ' + c.cid);
  async.waterfall([
    function (next) {
      categories.getAllTopicIds(c.cid, 0, -1, next);
    },
    function (tids, next) {
      async.each(tids, function(tid, next) {
        topics.setTopicField(tid, 'cid', c.cid, next);
      }, next);
    }
  ], next);
}

migrate.run = function(cid, callback) {
  async.waterfall([
    async.apply(db.getSortedSetRange, 'cid:' + cid + ':children', 0, -1),
    function (cids, next) {
      migrate.disableCategories(cids);
      categories.getCategoriesFields(cids, [], next);
    },
    function(data, next) {
      async.each(data, function(c, next){
        console.log(':: migrate subcategory: ' + c.cid)
        c.tag = utils.cleanUpTag(c.name, meta.config.maximumTagLength);

        async.parallel([
          // create the normal link using category name
          async.apply(topics.createEmptyTag, c.tag),
          // create custom tag
          async.apply(migrate.createCategoryLikeTag, c),
          async.apply(migrate.addCustomTagToTopics, c),
          async.apply(migrate.moveTopicToParentCategory, c, cid)
        ], next);
      }, next);
    }
  ], callback);
}

migrate.recover = function (cid, next){
  async.waterfall([
    async.apply(db.getSortedSetRange, 'cid:' + cid + ':children', 0, -1),
    function (cids, next) {
      migrate.enableCategories(cids);
      categories.getCategoriesFields(cids, [], next);
    },
    function(data, next) {
      async.each(data, function(c, next){
        migrate.recoverMoveTopicToParentCategory(c);
      }, next);
    }
  ], next);
}

// migrate.run(5, function() {
//   console.log('migration done');
// });

migrate.recover(5, function() {
  console.log('recover done');
});
module.exports = migrate;