all:
	make -j cogs jekyll

cogs:
	node_modules/.bin/cogs -w assets

jekyll:
	jekyll serve --watch
