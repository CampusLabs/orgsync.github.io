---
title: Decorate your Ruby Objects "Like a Boss"
link: http://devblog.orgsync.com/decorate-your-ruby-objects-like-a-boss/
author: drywheat
comments: true
post_name: decorate-your-ruby-objects-like-a-boss
tags: ruby
---

The "Decorator Pattern" is used to extend the functionality of a single object without affecting any other instances of the same class. You can easily add functionality to an entire class via inheritance, but it is impossible to extend a single object using this approach. This pattern allows you to apply your extensions in either a static or dynamic fashion.

A decorator should be designed so that it wraps the original class it is going to extend. It either adds new operations or modifies the existing functionality of the contained object. It is important that the decorator maintains the original object's interface by delegating all other function calls down to it.

The decorator is a simple yet extremely powerful concept. It is key in achieving separation of concerns, and is an essential tool for the [Open/closed principle](http://en.wikipedia.org/wiki/Open_Closed_Principle).

### Ruby-flavored Decoration

Ruby defines a couple of different ways to decorate objects in its 'delegate' standard library. The easiest to use the `SimpleDelegator` class. In this, you pass an object to the constructor and all the methods supported by the object will be delegated.


    require 'delegate'

    class Person
      def speak
        'hello'
      end

      def age
        30
      end
    end

    class LatinDecorator < SimpleDelegator
      # modifies existing functionality
      def speak
        "'hola' means '#{__getobj__.speak}'"
      end

      # adds new functionality
      def dance
        'cha-cha-cha'
      end
    end

    person  = Person.new
    wrapper = LatinDecorator.new(person)

    wrapper.speak # => "'hola' means 'hello'"
    wrapper.age # => 30
    wrapper.dance # => 'cha-cha-cha'


See online docs for API details: [Ruby Delegator](http://www.ruby-doc.org/stdlib-1.9.3/libdoc/delegate/rdoc/Delegator.html)

### Use Cases

In Rails, sometimes you have a model that should behave differently based on the context in which it is used. Creating several subclasses to cover each use-case is ludicrous. Creating several decorators to encompass a set of operations within a business domain is a really great solution to this problem.

An example: if your system allows you to create events but you want to extend eventing to allow for room reservation, you could use an approach like this:


    # Used to manage events
    class Event < ActiveRecord::Base
      # ...
    end

    class RoomReservationEventDecorator < SimpleDelegator
      def create_reservation
        # read in some extra data
        # create a reservation in a remote system
        # store a reference to that new remote reservation

        # lastly, save the changes to the wrapped event
        ___getobj__.save
      end
    end

    # this is a decorator, but we treat it like a regular event
    event = RoomReservationEventDecorator.new(Event.find(12345))

    event.title # => 'Super cool student event'
    event.create_reservation # => true


### Ruby 1.8.7 Caveats

This Ruby 1.9.3 implementation is clean, simple, and highly effective because the abstract base class `Delegator` inherits from `BasicObject`. This library is little less user-friendly in 1.8.7 because it inherits from `Object` and is subject to the effects of any core extensions added to that class. Furthermore, this version will not let you shadow and modify existing methods on the wrapped object because of the way the constructor was implemented. Here are some quick tips for remedying these two issues:

#### Re-define the constructor so that it behaves more like the 1.9.3 version and allows for existing method modification


    class MyDecorator < SimpleDelegator
      # mimicks 1.9.3 constructor
      def initialize(obj)
        __setobj__(obj)
      end

      # do some other work then invoke the original #work method
      def work
        other_work()
        __getobj__.work
      end

      private

      def other_work
        # ...
      end
    end


#### Explicitly delegate when defined Object methods get in your way


    class MyDecorator < SimpleDelegator
      # sometimes activesupport magic sauce hurts
      def to_param
        __getobj__.to_param
      end
    end


### Conclusion

I like using decorators because they are simple, and simple things break in simple ways. You can create a family of different decorators that can be used to extend a given object in different ways for different scenarios, and each decorator class is a nice, tight and clean chunk of added functionality. Of course, you could perform an instance-level mixin at runtime, but that's way too fancypants. That approach muddles the method space of an object and could potentially cause problems on account of method name contention.
