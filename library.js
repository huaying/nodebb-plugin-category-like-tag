"use strict";

var socketAdmin = require.main.require('./src/socket.io/admin');
var db = require.main.require('./src/database');
var categories = require.main.require('./src/categories');
var async = require('async');
var plugin = {};


var migrate = require('./migrate');

socketAdmin.plugins.clt = {};
socketAdmin.plugins.clt.migrate = function(socket, data, callback) {
  var excuted_cid = 5;
  migrate.run(excuted_cid, callback);
};
socketAdmin.plugins.clt.recover = function(socket, data, callback) {
  var excuted_cid = 5;
  migrate.recover(excuted_cid, callback);
};


plugin.init = function(params, callback) {
  params.router.get('/admin/plugins/category-like-tag', params.middleware.admin.buildHeader, renderAdmin);
  params.router.get('/api/admin/plugins/category-like-tag', renderAdmin);

  var redirect_middleware = function (req, res, next) {
	var key = 'cid:' + req.params.category_id + ':custom_tag';
	db.getObject(key, function(err, custom_tag) {
	  if (custom_tag && custom_tag.enable) {
		return res.redirect('/tags/' + custom_tag.tag);
	  } else {
		next();
	  }
	});
  };

  params.router.get('/category/:category_id/:slug?', redirect_middleware);
  params.router.get('/category/:category_id/:slug/:topic_index', redirect_middleware);
  callback();
};

plugin.addTagToCategory = function(data, next) {
  // hardcode
  if (data.category.cid !== 5) return next(null, data);
  var tagsNotInCompany = ['operating system'];
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
        'color'], next);
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
            if (tagsNotInCompany.includes(cate.tag)) {
              data.category.notCompany.push(cate);
            } else {
              data.category.company.push(cate);
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
