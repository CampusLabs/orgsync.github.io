The OrgSync DevBlog
=======

Basically a standard jekyll setup.

### To Run Locally:

- clone repo
- bundle install
- jekyll serve --watch
- view at localhost:4000

### To Deploy:

We use plugins so you can't just push to master. You must build Jekyll, so either run `jekyll build`, or `jekyll serve --watch` which will build automatically when a change is made. Then you can push to master.

### To Write A New Blog Post:

- Create a new file in _posts named with the convention: YYYY-MM-DD-title-dasherized

- Fill out the following FrontMatter fields:
````
---
title: Confidently Manage Business Logic with ActiveInteraction 
layout: single <!-- posts always use single -->
author: AaronLasseigne <!-- github username -->
description: lorem ipsum <!-- used on index summary -->
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

### Team Members :
- Edit team.yml

### Open Source Projects:
- Edit open_source.yml
