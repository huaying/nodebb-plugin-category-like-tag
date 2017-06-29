'use strict';
/* globals app, define, socket, config, ajaxify, bootbox */

define('admin/plugins/category-like-tag', [], function() {
  var ACP = {};
  var cids = []

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
    $('#save').click(function() {
      var data = cids.map(function(cid) {
        return { cid: cid, isCompanyTag: $('#'+cid).is(":checked") };
      });
      socket.emit('admin.plugins.clt.update', data, function() {
        bootbox.alert('update done');
      });
    });

    socket.emit('admin.plugins.clt.getCustomTags', function(err, categories) {
      categories.forEach(function(category) {
        var checkbox = (category.isCompanyTag) ?
          "<td><input id="+category.cid+" type=checkbox checked /></td>" :
          "<td><input id="+category.cid+" type=checkbox /></td>";
        var categoryName = "<td>"+category.name+"</td>";
        cids.push(category.cid);
        $("#tags").append('<tr>'+checkbox+categoryName+'</tr>');
      });
    });
	};

	return ACP;
});
