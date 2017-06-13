# nodebb-plugin-category-like-tag

Install:

1. git clone this repo to nodebb/node_modules_customs/
2. make Symbolic link linking to nodebb/node_modules/
3. `./nodebb build` and go to discuss admin control panel(acp) to click on `reload`
4. go to plugin's settings in acp and run the migrate
5. go to acp and run `restart`

- p.s. make sure the order of the plugin should come after nodebb-theme-leetcode so that it can override the template

- Done: redirect `/category/767/operating-system` to `/tags/operating%20system`
