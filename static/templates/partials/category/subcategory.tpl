<!-- IF enableTagMode -->
<style>
 ul.categories li[component="categories/category"] {
    border: none;
    position: relative;
    padding-left: 18px;
    margin: 0 13px 0 0;
    display: inline-block;
    min-height: 38px;
    padding-bottom: 15px;
	}
	ul.categories li[component="categories/category"] .content {
    line-height: 28px;
    padding: 0;
		display: inline!important;
		float: none!important;
	}
	ul.categories li[component="categories/category"] .icon {
    display: inline-block!important;
    font-size: 17px;
    line-height: 17px;
    padding: 6px;
    border-radius: 50%;
    margin-right: 5px;
    min-width: 30px;
    min-height: 30px;
    margin-top: 2px;
}
ul.categories li[component="categories/category"] .icon i {
    width: 23px!important;
}
ul.categories li[component="categories/category"] .content h2 {
    display: inline;
    margin-left: 0;
    font-size: 14px;
}
ul.categories li[component="categories/category"] .content h2 a {
    display: inline;
    white-space: nowrap;
}
</style>

<div class="subcategory">
  <!-- IF notCompany.length --><p>category tags</p><!-- ENDIF notCompany.length -->
	<ul class="categories" itemscope itemtype="http://www.schema.org/ItemList">
		<!-- BEGIN notCompany -->
		<!-- IMPORT partials/categories/tag_item.tpl -->
		<!-- END notCompany -->
	</ul>
  <!-- IF company.length --><p>company tags</p><!-- ENDIF company.length -->
  <ul class="categories" itemscope itemtype="http://www.schema.org/ItemList">
		<!-- BEGIN company -->
		<!-- IMPORT partials/categories/tag_item.tpl -->
		<!-- END company -->
	</ul>
</div>
<!-- ELSE -->
<div class="subcategory">
	<!-- IF children.length --><p>[[category:subcategories]]</p><!-- ENDIF children.length -->

	<ul class="categories" itemscope itemtype="http://www.schema.org/ItemList">
		<!-- BEGIN children -->
		<!-- IMPORT partials/categories/item.tpl -->
		<!-- END children -->
	</ul>
</div>
<!-- ENDIF enableTagMode -->
