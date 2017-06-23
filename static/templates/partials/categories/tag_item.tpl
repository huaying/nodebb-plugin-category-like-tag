<li component="categories/category" data-cid="{../cid}" data-numRecentReplies="1" class="row clearfix">
  <meta itemprop="name" content="{../name}">

  <div class="content col-xs-12 <!-- IF config.hideCategoryLastPost -->col-md-10 col-sm-12<!-- ELSE -->col-md-7 col-sm-9<!-- ENDIF config.hideCategoryLastPost -->">
    <div class="icon pull-left" style="{function.generateCategoryBackground}">
      <i class="fa fa-fw {../icon}"></i>
    </div>

    <h2 class="title">
      <a href="{config.relative_path}/tags/{../parentCid}/{../tag}" itemprop="url">
      {../name}
      </a><br/>
    </h2>
  </div>
</li>
