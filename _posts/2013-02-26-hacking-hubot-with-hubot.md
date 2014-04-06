---
title: Hacking Hubot with Hubot
layout: single
author: tfausak
comments: true
tags: hack
description: Right before last week's dallas.rb hack night, my coworker planted an idea in my head. He thought programming Hubot on the fly would be neat. I agreed with him; modifying Hubot from within the chat room simply by talking to him would be awesome. Since I spent last week hacking on Node.js, I figured I'd take a crack at it.
---

Right before last week's [Dallas Ruby Brigade](http://www.dallasrb.org) hack night, my coworker [Aaron](http://ficate.com) planted an idea in my head. He thought programming [Hubot](http://hubot.github.com) on the fly would be neat. I agreed with him; modifying Hubot from within the chat room simply by talking to him would be awesome. Since I spent last week hacking on Node.js and working on other Hubot scripts like [bang-bang](https://github.com/github/hubot-scripts/blob/master/src/scripts/bang-bang.coffee), I figured I'd take a crack at it.

Adding functionality to Hubot is easy with [Hubot scripts](https://github.com/github/hubot-scripts). There are lots of good examples in that repository, but at their core they're all the same. They take a pattern and a callback. When someone says something that matches the pattern, it runs the callback.

For example:

{% highlight ruby %}
  module.exports = (robot) ->
    robot.respond /ping/i, (msg) ->
      msg.send('pong')
{% endhighlight %}

Give that a whirl and you'll end up with something like:

{% highlight ruby %}
  user  > hubot ping
  hubot > pong
{% endhighlight %}

Piece of cake, right? Turns out, dynamically programming Hubot isn't much harder. All you need is a regular expression that looks for both a pattern and callback, then evaluates them and calls `robot.respond` with the results.

{% highlight ruby %}
  module.exports = (robot) ->
    robot.respond /respond (\/.+\/i) (.+)/i, (msg) ->
      robot.respond eval(msg.match[1]), eval(msg.match[2])
{% endhighlight %}

(This seems like as good a time as any to point out that having a programmable Hubot means that it's possible for someone to write a malicious script. Consider yourself warned.)

The only thing to watch out for here is that this forces the pattern to be case-insensitive by requiring the `i` flag. This allows you to address your Hubot as "Hubot", "hubot", or "HUBOT".

But that's all you need to have a completely programmable Hubot! Here's how it ends up working:

{% highlight ruby %}
  user  > hubot respond /widdly/i _ = function (msg) { msg.send('scuds'); }
  user  > hubot widdly
  hubot > scuds
{% endhighlight %}

There are a few more caveats here. First of all, you have to write the callback in JavaScript, not CoffeeScript. You could avoid this by adding the `coffee-script` dependency and doing `CoffeeScript.eval` instead of the plain `eval`, but I didn't want to do that. Mostly because typing CoffeeScript in chat clients is annoying.

Secondly, there's a lot of boilerplate. Since we're `eval`ing the callback, it needs to be an expression that evaluates to a function. The easiest way to do that is to assign a function to a variable. The obvious choice for a variable name is `_` because we don't care what it's called. And we have to pick the parameter name even though most Hubot scripts use `msg`.

Fortunately CoffeeScript's string interpolation makes it easy to remove a lot of the boilerplate:

{% highlight ruby %}
  module.exports = (robot) ->
    robot.respond /respond \/(.+)\/ (.+)/i, (msg) ->
      pattern = eval("/#{msg.match[1]}/i")
      callback = eval("_ = function (msg) { #{msg.match[2]} }")
      robot.respond pattern, callback
{% endhighlight %}

Now it's much easier to modify Hubot on the fly:

{% highlight ruby %}
  user  > hubot respond /spam/ msg.send('baked beans')
  user  > hubot spam
  hubot > baked beans
{% endhighlight %}

That pretty much covers the "create" part of CRUD. But what if you want to list all the responders you've added to Hubot? Or change one of them? Or remove one of them entirely? At this point, you can't. Adding that functionality poses more of a challenge and requires diving into Hubot's internals ---||| the `[Robot#respond`](https://github.com/github/hubot/blob/master/src/robot.coffee#L62) method in particular:

{% highlight ruby %}
  class Robot
    # ...
    respond: (regex, callback) ->
      # ...
      @listeners.push new TextListener(@, newRegex, callback)
{% endhighlight %}

Given a regular expression and a callback, it performs some work on the regex before pushing a new listener onto its stack of listeners. That means every time you call `robot.respond`, the listeners array grows by one and the last element is the thing you just added. You can use its index to read it back later, modify it, or remove it.

Moving all this functionality into a class made sense to me. I'll get to the actual implementation in a second, but here's how the script will end up looking:

{% highlight ruby %}
  module.exports = (robot) ->
    responders = new Responders(robot)
    robot.respond /responders/i, (msg) ->
      msg.send(("/#{pattern}/ #{responder.callback}" for pattern, responder of responders.responders()).join('\n'))
    robot.respond /responder \/(.+)\//i, (msg) ->
      msg.send(responders.responder(msg.match[1]))
    robot.respond /forget \/(.+)\//i, (msg) ->
      responders.remove(msg.match[1])
    robot.respond /respond \/(.+)\/ ([^]+)/i, (msg) ->
      responders.add(msg.match[1], msg.match[2])
{% endhighlight %}

As you can see, it's a pretty simple interface. I called it `Responders` so it wouldn't clash with Hubot's `Listener` class. Using the pattern as a key into the `remove` and `responder` method seemed like a natural choice since I assume you don't want Hubot to have multiple responses to the same pattern. Everything behaves like you'd expect: `add` adds responders, `remove` removes them, `responder` finds one, and `responders` gets all of them.

Now that you've seen how it behaves, how does it look behind the scenes? It stores everything as an object in the robot brain, which persists if your Hubot is set up that way.

{% highlight ruby %}
  class Responders
    constructor: (@robot) ->
      @robot.brain.data.responders = {}
    responders: ->
      @robot.brain.data.responders
    responder: (pattern) ->
      @responders()[pattern]
{% endhighlight %}

Adding a responder works by first removing any responder with the same pattern, then adding it with `robot.respond`, and finally saving it to the brain. Note that it doesn't use the `eval`ed pattern or callback for storage in the brain; this makes it easier to inspect and reason about.

{% highlight ruby %}
  add: (pattern, callback) ->
    eval_pattern = eval("/#{pattern}/i")
    eval_callback = eval("_ = function (msg) { #{callback} }")
    @remove(pattern)
    @robot.respond(eval_pattern, eval_callback)
    @responders()[pattern] = {
      callback: callback,
      index: @robot.listeners.length - 1,
    }
{% endhighlight %}

Removing responders is the last piece of the puzzle. First it makes sure it's actually responding to the pattern in the first place. Then another sanity check to ensure it knows where it is in the listeners array. Then it replaces itself with `(->)`, an empty callback. After all that, it deletes itself from the brain.

{% highlight ruby %}
  remove: (pattern) ->
    responder = @responder(pattern)
    if responder
      if responder.index
        @robot.listeners.splice(responder.index, 1, (->))
      delete @responders()[pattern]
{% endhighlight %}


You may be wondering why it assigns an empty callback to the listener instead of deleting it outright. If you delete it, Hubot will complain: `ERROR Unable to call the listener: TypeError: Cannot call method 'call' of undefined`.

This script is available in the [Hubot scripts](https://github.com/github/hubot-scripts) repository as [responders](https://github.com/github/hubot-scripts/blob/master/src/scripts/responders.coffee). Patches welcome!

_[Originally posted to [my blog](http://taylor.fausak.me/2013/02/24/hacking-hubot-with-hubot/).]_
