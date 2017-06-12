'use strict';
/* globals app, define, socket, config, ajaxify, bootbox */

define('admin/plugins/category-like-tag', [], function() {
  var ACP = {};

	ACP.init = function() {

    $('#save').click(function() {
      socket.emit('admin.plugins.clt.migrate', function(err, data) {

      })
    })
	};

	return ACP;
});
