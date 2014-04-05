The OrgSync DevBlog
=======

Basically a standard jekyll setup.

### To Run Locally:

- clone repo
- bundle install
- jekyll serve --watch
- view at localhost:4000

### To Deploy:

Using standard github pages so just push to gh-pages branch

### To Write:

- Create a new file in _posts named with the convention: YYYY-MM-DD-title-dasherized

- Fill out the following FrontMatter fields:
````
---
title: Confidently Manage Business Logic with ActiveInteraction
layout: single
author: AaronLasseigne
description: lorem ipsum
comments: true
tags: patterns rails
---
````

- Start at H3's in your markdown "###" for consistency's sake
- use the tags {% highlight ruby %} and {% endhighlight %} to wrap your code blocks. (where ruby is your language of choice)

### Tags:
You can tag your post anything you want. The only ones that will get colored are :
[patterns, ruby, rails, security, design, hack, iOS, testing, hack]. If there is another tag we are going to be repeating we can
add it to the css. Otherwise, your tags will still be listed, just not colored to standout.

