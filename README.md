The OrgSync DevBlog
=======

Basically a standard jekyll setup.

### To Run Locally:

- clone repo
- bundle install
- npm install
- jekyll serve --watch (by default throws it on port 4000)
- node_modules/.bin/cogs -w (to run cogs and watch it)
- view at localhost:4000

### To Deploy:

Right now we don't use any plugins so you can just push to master to deploy.

~~We use plugins so you can't just push to master. You must build Jekyll, so either run `jekyll build`, or `jekyll serve --watch` which will build automatically when a change is made. Then you can push to master.~~

### To Write A New Blog Post:

- Create a new file in `_posts` named with the convention: YYYY-MM-DD-title-dasherized. (You can also draft your post in `_drafts`)

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
You can tag your post anything you want. Tags that we've used a few times will be colored. If there is another tag we are going to be repeating we can add it to the css. Otherwise, your tags will still be listed, just not colored to standout.

### Edit Team Members:
- All listed in team.yml
- Don't remove a team member who has blog posts. Just set their active: false. This removes them from the team list page but keeps their name on the blog posts. _Note: the pictures all point to url's on our frontend. When marketing removes them from the site their image will disappear._

### Open Source Projects:
- Edit open_source.yml
