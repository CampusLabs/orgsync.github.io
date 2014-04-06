---
title: Common Backbone Patterns Simplified with Marionette
layout: single
author: mrwade
comments: true
tags: javascript
description: I fell so head-first into Backbone that I quickly outgrew the conventions it set in place. I needed a way to nest views without a bunch of boilerplate, a way to clean up views after destroying them, and some sort of way to swap views in and out when switching modes in my app. There really aren't conventions set in place by Backbone to do these types of things.
---

I got my first dose of [Backbone](http://backbonejs.org/) on a side project after having surpassed the level of jQuery code anyone could possibly keep organized. Once I got the concepts down and a working prototype, I was in love. It allowed me to do the things I had been dreaming of doing on the front-end without the code growing into a giant hairball.

I fell so head-first into Backbone that I quickly outgrew the conventions it set in place. I needed a way to nest views without a bunch of boilerplate, a way to clean up views after destroying them, and some sort of way to swap views in and out when switching modes in my app. There really aren't conventions set in place by Backbone to do these types of things.

Mr. [@derickbailey](http://twitter.com/derickbailey) has done an excellent job compiling together many common needs of a front-end Backbone app into a library he calls [Marionette](http://marionettejs.com). It's jam-packed with components on how to help manage views, application infrastructure, messaging, and more. I've been using it for over a year now (since v0.4.5) and have really only scratched the surface.

Part of the beauty of Marionette is that, like Backbone, you only use the components you need. Get started with one and gradually give the others a try.

My favorite part of Marionette is its view management, so I'd like to walk you through a common case of building up a UI where nesting, cleaning up, and swapping views becomes quickly necessary:

### Example App

Today's example app will be quite simple: We'll build up a user list of the top 3 committers to Backbone. Then, we'll add in a nav bar that lets us switch between views.

This example is a bit of overkill for rendering such a simple UI, but it represents what could be turned into a list with full CRUD or other actions for each row.

### Nesting Views

Even a simple list view is really composed of nested views. The list itself represents a collection, and each item represents a model. Both the collection and each model could really use their own views to keep re-rendering changes minimized, as well as offering sensible places to listen for events based upon their relevancy to the collection as a whole or a specific model.

#### Backbone Version

First, let's look at how this might be accomplished in a pure Backbone app:

_See it on [JSFiddle](http://jsfiddle.net/mrwade/RK54t/)_

{% highlight javascript %}
  # Data Model
  class User extends Backbone.Model
  class Users extends Backbone.Collection
    model: User

  users = new Users([
    {name: 'Jeremy Ashkenas', twitter: 'jashkenas'},
    {name: 'Brad Dunbar', twitter: 'braddunbar'},
    {name: 'Casey Foster', twitter: 'caseywebdev'}
  ])

  # Views
  class UserView extends Backbone.View
    template: _.template('<li><%= name %> (@<%= twitter %>)</li>')

    initialize: ->
      @listenTo @model, 'change', @render

    render: =>
      @$el.html @template(@model.toJSON())
      this

  class UserListView extends Backbone.View
    el: '#user_list'
    tagName: 'ul'

    initialize: ->
      @listenTo @collection, 'add remove reset', @render

    render: =>
      @$el.empty()
      @collection.each (model) =>
        itemView = new UserView(model: model)
        @$el.append itemView.render().el
      this

  # Initialize
  (new UserListView collection: users).render()
{% endhighlight %}

First, we have a simple data model: a `User`, a collection to match, and our data set.

The `UserView` represents each user. It listens to changes on the model and invokes a `render()` when they occur. This would also be the place to listen for any events related to a specific user if we wanted to perform operations on that record.

The `UserListView` represents the user collection and handles creating a view for each user model in the data set. It blindly re-renders upon additions or removals to the collection.

This seems like a pretty common use case, but it's a lot of code just to render out a list and respond to changes. So let's see how we can simplify this use case with Marionette.

#### Marionette Example:

_See it on [JSFiddle](http://jsfiddle.net/mrwade/fqFSu/)_

{% highlight javascript %}
  # Data Model
  class User extends Backbone.Model
  class Users extends Backbone.Collection
    model: User

  users = new Users([
    {name: 'Jeremy Ashkenas', twitter: 'jashkenas'},
    {name: 'Brad Dunbar', twitter: 'braddunbar'},
    {name: 'Casey Foster', twitter: 'caseywebdev'}
  ])

  # Views
  class UserView extends Backbone.Marionette.ItemView
    template: (viewObject) ->
      _.template('<li><%= name %> (@<%= twitter %>)</li>', viewObject)

  class UserListView extends Backbone.Marionette.CollectionView
    el: '#user_list'
    itemView: UserView
    tagName: 'ul'

  # Initialize
  (new UserListView collection: users).render()
{% endhighlight %}

A Marionette [CollectionView](https://github.com/marionettejs/backbone.marionette/blob/master/docs/marionette.collectionview.md) represents a collection and automatically renders out an [ItemView](https://github.com/marionettejs/backbone.marionette/blob/master/docs/marionette.itemview.md) for each item. They can be customized to fit your specific needs, but, for basic cases, only a few options need to be set up to get going.

These views handle listening and responding to changes within the data set, providing additional events to listen to, and having cleanup mechanisms to properly close out views and free up memory. All of these are common concerns when dealing with Backbone views.

### Swapping Views

Now let's build up some simple navigation: 'Home' and 'Users'. When clicking each nav item, we'll need to close up the currently displayed view and show the new one. For that, Marionette offers [Layouts](https://github.com/marionettejs/backbone.marionette/blob/master/docs/marionette.layout.md) which handle areas within it called [Regions](https://github.com/marionettejs/backbone.marionette/blob/master/docs/marionette.region.md).

#### Marionette Example:

_See it on [JSFiddle](http://jsfiddle.net/mrwade/HXLGw/)_

{% highlight javascript %}
  # extends the previous Marionette example:

      class HomeView extends Backbone.Marionette.ItemView
        template: -> 'Example App Home'

      # Main Layout
      class AppLayout extends Backbone.Marionette.Layout
        el: '#app_layout'

        regions:
          main: '#main'

        events:
          'click a[href=#home]': 'showHome'
          'click a[href=#user-list]': 'showUserList'

        initialize: ->
          @showHome()

        showHome: =>
          @main.show new HomeView()

        showUserList: =>
          @main.show new UserListView(collection: users)

      # Initialize
       (new AppLayout()).render()
{% endhighlight %}

Our layout listens to nav item clicks and responds accordingly to show the respective view. When swapping views, a Layout will automatically utilize a Marionette View's close mechanism to properly remove it and then automatically render in the new view. As demonstrated here, Marionette components work very nicely when used together.

As your needs grow, Marionette offers an [Application](https://github.com/marionettejs/backbone.marionette/blob/master/docs/marionette.application.md) object with sub-[Modules](https://github.com/marionettejs/backbone.marionette/blob/master/docs/marionette.application.module.md) for more powerful management of a more demanding front-end application.

### close:

Marionette claims that it "[simplifies] the construction of large-scale JavaScript applications," but I would argue that it's not just for large-scale applications. It's a framework that sets conventions for building clean and efficient front-end applications of all sizes. I'd invite you to take a look at its many [pieces](https://github.com/marionettejs/backbone.marionette#marionettes-pieces) and how they could simplify your apps.
