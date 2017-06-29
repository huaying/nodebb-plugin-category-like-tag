"use strict";

var socketAdmin = require.main.require('./src/socket.io/admin');
var db = require.main.require('./src/database');
var categories = require.main.require('./src/categories');
var middleware = require.main.require('./src/middleware');
var helpers = require.main.require('./src/routes/helpers');
var async = require('async');
var plugin = {};

var validator = require.main.require('validator');
var user = require.main.require('./src/user');
var topics = require.main.require('./src/topics');
var pagination = require.main.require('./src/pagination');
var controllersHelpers = require.main.require('./src/controllers/helpers');


var migrate = require('./migrate');
var excuted_cid = 5;

socketAdmin.plugins.clt = {};
socketAdmin.plugins.clt.migrate = function(socket, data, callback) {
  migrate.run(excuted_cid, callback);
};
socketAdmin.plugins.clt.recover = function(socket, data, callback) {
  migrate.recover(excuted_cid, callback);
};
socketAdmin.plugins.clt.update = function(socket, data, callback) {
  async.each(data, function(cate, next){
    db.setObjectField('cid:' + cate.cid + ':custom_tag', 'isCompanyTag', cate.isCompanyTag, next);
  }, callback);
};
socketAdmin.plugins.clt.getCustomTags = function(socket, data, callback) {
  async.waterfall([
    async.apply(db.getSortedSetRange, 'cid:' + excuted_cid + ':children', 0, -1),
    function (cids, next) {
      categories.getCategoriesFields(cids, ['cid', 'name'], next);
    },
    function(categories, next) {
      async.eachSeries(categories, function(cate, next) {
        var key = 'cid:' + cate.cid + ':custom_tag';
        db.getObject(key, function(err, custom_tag) {
          if (custom_tag) {
            cate.isCompanyTag = custom_tag.isCompanyTag;
          }
          next();
        });
      }, function(err) {
        next(err, categories);
      });
    }
  ], callback);
}


plugin.init = function(params, callback) {
  params.router.get('/admin/plugins/category-like-tag', params.middleware.admin.buildHeader, renderAdmin);
  params.router.get('/api/admin/plugins/category-like-tag', renderAdmin);

  var redirect_middleware = function (req, res, next) {
    var key = 'cid:' + req.params.category_id + ':custom_tag';
    async.waterfall([
      async.apply(categories.getCategoryFields, req.params.category_id, ['parentCid']),
      function(results, next) {
        db.getObject(key, function(err, custom_tag) {
          if (custom_tag && custom_tag.enable && results.parentCid) {
            return res.redirect('/tags/' + results.parentCid + '/' + custom_tag.tag);
          }
          next();
        });
      }
    ], next);
  };

  params.router.get('/category/:category_id/:slug?', redirect_middleware);
  params.router.get('/category/:category_id/:slug/:topic_index', redirect_middleware);

  var setupPageRoute = helpers.setupPageRoute;
  setupPageRoute(params.router, '/tags/:category_id/:tag', middleware, [middleware.privateTagListing], plugin.get_category_tag);
  callback();
};

plugin.get_category_tag = function(req, res, next) {
  async.waterfall([
    async.apply(categories.getCategoryFields, req.params.category_id, ['cid', 'name']),
    function(results, next) {
      var tag = validator.escape(String(req.params.tag));
      var page = parseInt(req.query.page, 10) || 1;

      var templateData = {
        topics: [],
        tag: tag,
        cid: results.cid,
        breadcrumbs: controllersHelpers.buildBreadcrumbs([{ text: '[[tags:tags]]', url: '/tags' }, { text: tag }]),
        title: '[[pages:tag, ' + tag + ']]',
      };
      var settings;
      var topicCount = 0;
      async.waterfall([
        function (next) {
          user.getSettings(req.uid, next);
        },
        function (_settings, next) {
          settings = _settings;
          var start = Math.max(0, (page - 1) * settings.topicsPerPage);
          var stop = start + settings.topicsPerPage - 1;
          templateData.nextStart = stop + 1;
          async.parallel({
            topicCount: function (next) {
              topics.getTagTopicCount(tag, next);
            },
            tids: function (next) {
              topics.getTagTids(req.params.tag, start, stop, next);
            },
          }, next);
        },
        function (results, next) {
          if (Array.isArray(results.tids) && !results.tids.length) {
            return res.render('tag', templateData);
          }
          topicCount = results.topicCount;
          topics.getTopics(results.tids, req.uid, next);
        },
      ], function (err, topics) {
        if (err) {
          return next(err);
        }

        res.locals.metaTags = [
          {
            name: 'title',
            content: tag,
          },
          {
            property: 'og:title',
            content: tag,
          },
        ];
        templateData.topics = topics;

        var pageCount =	Math.max(1, Math.ceil(topicCount / settings.topicsPerPage));
        templateData.pagination = pagination.create(page, pageCount);

        res.render('tag', templateData);
      });
    }
  ], next);
};


plugin.addTagToCategory = function(data, next) {
  // hardcode
  if (data.category.cid !== 5) return next(null, data);
  data.category.enableTagMode = true;

  async.waterfall([
    async.apply(db.getSortedSetRange, 'cid:' + data.category.cid + ':children', 0, -1),
    function (cids, next) {
      categories.getCategoriesFields(cids, [
        'cid',
        'name',
        'icon',
        'backgroundImage',
        'imageClass',
        'bgColor',
        'image',
        'color',
        'parentCid'], next);
    },
    function (cates, next) {
      //hardcode
      data.category.company = [];
      data.category.notCompany = [];

      async.eachSeries(cates, function(cate, next) {
        var key = 'cid:' + cate.cid + ':custom_tag';
        cate.children = [];
        cate.posts = [];
        db.getObject(key, function(err, custom_tag) {
          if (custom_tag) {
            cate.tag = custom_tag.tag;
            if (custom_tag.isCompanyTag) {
              data.category.company.push(cate);
            } else {
              data.category.notCompany.push(cate);
            }
          }
          next();
        });
      }, function(err) {
        next(err, data);
      });
    }
  ], function(err) {
    next(err, data);
  })
};

function renderAdmin(req, res, next) {
	res.render('admin/plugins/category-like-tag', {});
}


var admin = {};
admin.menu = function(custom_header, callback) {
	custom_header.plugins.push({
		route: '/plugins/category-like-tag',
		icon: 'fa-hashtag',
		name: 'Category-like Tag'
	});

	callback(null, custom_header);
};

plugin.admin = admin;
module.exports = plugin;
