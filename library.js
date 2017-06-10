"use strict";

var socketAdmin = require.main.require('./src/socket.io/admin');
var plugin = {};


var dev = require('./develop')
dev();

socketAdmin.plugins.clt = {};
socketAdmin.plugins.clt.createMapping = function() {

};

/* setup admin template, dropdown and router */

plugin.init = function(params, callback) {
  params.router.get('/admin/plugins/category-like-tag', params.middleware.admin.buildHeader, renderAdmin);
  params.router.get('/api/admin/plugins/category-like-tag', renderAdmin);
  callback();
}


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
