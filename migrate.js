
var db = require.main.require('./src/database');
var async = require('async');
var categories = require.main.require('./src/categories');
var utils = require.main.require('./src/utils');
var meta = require.main.require('./src/meta');
var topics = require.main.require('./src/topics');

var migrate = {};
migrate.disableCategories = function(cids) {
  // console.log('disable subcategories');
  cids.forEach(function(cid) {
    db.setObjectField('category:' + cid, 'disabled', 1);
  });
};

migrate.enableCategories = function(cids) {
  // console.log('disable subcategories');
  cids.forEach(function(cid) {
    db.setObjectField('category:' + cid, 'disabled', 0);
  });
};

migrate.createOrEnableCategoryLikeTag = function(c, next) {
  console.log('create custom tag structure: ' + c.cid);
  var custom_tag_key =  'cid:' + c.cid + ':custom_tag';
  async.waterfall([
    function (next) {
      categories.getAllTopicIds(c.cid, 0, -1, next);
    },
    function (topicIds, next) {
      async.waterfall([
        async.apply(db.getObject, custom_tag_key),
        function(custom_tag, next) {
          var data = {
            tag: c.tag,
            enable: true,
            isCompanyTag: custom_tag.isCompanyTag || false,
            topicIds: topicIds  // is this useful?
          };
          db.setObject(custom_tag_key, data, next);
        },
      ], next);
    }
  ], next);
};

migrate.disableCategoryLikeTag = function(c, next) {
  db.setObjectField('cid:' + c.cid + ':custom_tag', 'enable', false, next);
};

migrate.addCustomTagToTopics = function(c, next) {
   console.log('add custom tag to topics: ' + c.cid);
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
};

migrate.moveTopicToParentCategory = function(c, parentCid, next) {
   console.log('move topic to parent\'s category: ' + c.cid);
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
   console.log('recover starts: ' + c.cid);
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
};

migrate.run = function(cid, callback) {
  async.waterfall([
    async.apply(db.getSortedSetRange, 'cid:' + cid + ':children', 0, -1),
    function (cids, next) {
      migrate.disableCategories(cids);
      categories.getCategoriesFields(cids, ['cid', 'name'], next);
    },
    function(data, next) {
      async.each(data, function(c, next){
        console.log(':: migrate subcategory: ' + c.cid)
        c.tag = utils.cleanUpTag(c.name, meta.config.maximumTagLength);

        async.parallel([
          // create the normal link using category name
          async.apply(topics.createEmptyTag, c.tag),
          // create custom tag
          async.apply(migrate.createOrEnableCategoryLikeTag, c),
          async.apply(migrate.addCustomTagToTopics, c),
          async.apply(migrate.moveTopicToParentCategory, c, cid)
        ], next);
      }, next);
    }
  ], callback);
};

migrate.recover = function (cid, callback){
  async.waterfall([
    async.apply(db.getSortedSetRange, 'cid:' + cid + ':children', 0, -1),
    function (cids, next) {
      migrate.enableCategories(cids);
      categories.getCategoriesFields(cids, ['cid', 'name'], next);
    },
    function(data, next) {
      async.each(data, function(c, next){
		async.parallel([
		  async.apply(migrate.recoverMoveTopicToParentCategory, c),
			async.apply(migrate.disableCategoryLikeTag, c)
		  ], next);
      }, next);
    }
  ], callback);
};

// migrate.run(5, function() {
//   console.log('migration done');
// });

// migrate.recover(5, function() {
//   console.log('recover done');
// });
module.exports = migrate;
