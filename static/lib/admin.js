'use strict';
/* globals app, define, socket, config, ajaxify, bootbox */

define('admin/plugins/category-like-tag', [], function() {
  var ACP = {};

	ACP.init = function() {
    $('#migrate').click(function() {
      socket.emit('admin.plugins.clt.migrate', function() {
        bootbox.alert('migration done');
      })
    });
    $('#recover').click(function() {
      socket.emit('admin.plugins.clt.recover', function() {
        bootbox.alert('recover done');
      })
    });
	};

	return ACP;
});
