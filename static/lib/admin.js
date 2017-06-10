'use strict';
/* globals app, define, socket, config, ajaxify, bootbox */

define('admin/plugins/category-like-tag', [], function() {
  var ACP = {};

	ACP.init = function() {

    $('#save').click(function() {
      console.log('save clicked');
      socket.emit('admin.plugins.clt.createMapping', function(err, data) {

      })
    })
	};

	return ACP;
});
