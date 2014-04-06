---
title: OrgSync Hack Night Arduino
layout: single
author: vtraweek
comments: true
tags: hack
description: OrgSync hosts a monthly hack night in partnership with the Dallas Ruby Brigade here in the office. As a software shop, we don't often get a chance to play with hardware. But last Tuesday we mixed things up a bit and experimented with an Arduino using Ruby bootstrapping gems.
---

OrgSync hosts a monthly hack night in partnership with the [Dallas Ruby Brigade](http://www.dallasrb.org) here in the office. As a software shop, we don't often get a chance to play with hardware. But last Tuesday we mixed things up a bit and experimented with an Arduino using Ruby bootstrapping gems.

For those who don’t know, [Arduino](http://www.arduino.cc) is an open-source electronics prototyping platform. Arduino users are pretty serious about their projects, and therefore documentation is abundant online. The traditional Arduino development environment is programmed based on C and C++, making it less than optimal for hard-core Rubyists.

So we decided to find Ruby implementations of the Arduino interface. After some research and testing (we tried, [Dino](https://github.com/austinbv/dino), [Firmata](http://shokai.github.io/arduino_firmata), and the [Arduino gem by HashNuke](https://github.com/HashNuke/arduino)), we settled on Dino.

The result of our evening of hacking was three blinking LED’s (by changing the timing inputs, we got them to blink at different rates).

For those who are curious, here’s the code we ended up using:

{% highlight ruby %}
  require 'bundler/setup'
  require 'dino'

  board = Dino::Board.new(Dino::TxRx.new)

  threads = []
  threads << Thread.new do
    led = Dino::Components::Led.new(pin: 6, board: board)

    threads << Thread.new do
      [:on, :off].cycle do |switch|
        led.send(switch)
        sleep 0.5
      end
    end
  end
  threads << Thread.new do
    led = Dino::Components::Led.new(pin: 7, board: board)

    threads << Thread.new do
      [:on, :off].cycle do |switch|
        led.send(switch)
        sleep 0.1
      end
    end
  end
  threads << Thread.new do
    led = Dino::Components::Led.new(pin: 13, board: board)

    threads << Thread.new do
      [:on, :off].cycle do |switch|
        led.send(switch)
        sleep 1
      end
    end
  end

  threads.each { |thr| thr.join }
{% endhighlight %}

At future hack nights, we’re going to be playing with our new hardware more and trying to program larger numbers of blinking lights and, maybe if we’re feeling ambitious, we'll even program in some interactivity.
