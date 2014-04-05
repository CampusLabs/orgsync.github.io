---
title: Selecting Overloaded Java methods in JRuby
link: http://devblog.orgsync.com/selecting-overloaded-java-methods-in-jruby/
author: drywheat
comments: true
post_name: selecting-overloaded-java-methods-in-jruby
---

JRuby, a Ruby language implementation that runs on the JVM, allows developers to leverage the vast number of powerful libraries that have been written in Java while maintaining the simplicity and terse nature of the Ruby programming language. Since Java allows for method overloading and Ruby does not, at some point we may find ourselves needing to choose which overload we want to invoke. Thankfully, JRuby provides us with a couple of mechanisms.

Before we actually discuss how to choose method overloads, we first need a little understanding about how Ruby objects can be casted into Java objects.

### Auto-casting primitive Ruby types to Java

When calling Java code from Ruby, primitive Ruby types are automatically converted to their default boxed Java types. You can examine these default types by invoking `#to_java` on your Ruby objects.


    'orgsync'.to_java # => #<Java::JavaLang::String:0x3b8590c5>
    2013.to_java # => #<Java::JavaLang::Long:0x5ae6c6d7>
    3.14.to_java # => #<Java::JavaLang::Double:0x635c80a4>
    true.to_java # => #<Java::JavaLang::Boolean:0x32554189>


### Explicit casting

You can also explicitly cast your Ruby objects into compatible Java types by passing an argument to the `#to_java` method.


    2013.to_java(:short) # => #<Java::JavaLang::Short:0x59046270>
    3.14.to_java(:float) # => #<Java::JavaLang::Float:0x670064a4>


### Method signature ambiguity

When passing your Ruby objects to Java methods, JRuby will try its best to cast them into the most suitable type. Sometimes, this operation fails because a method's overloads accept very similar argument types in relation to the provided object.

As an example, let's examine the type `org.apache.poi.hssf.usermodel.HSSFRow` defined in Apache's POI library. Instances of this class respond to the method `createCell()`; it accepts 1 argument and has 2 overloads, namely, `HSSFRow#createCell(int)` and `HSSFRow#createCell(short)`.

Since, in our code, we would most likely pass this method a Ruby Fixnum like `123`, JRuby will issue a warning in the console/logs indicating that it was unable to figure out the correct overload. This makes sense since our Fixnum will automatically cast into a `java.lang.Long` object, which is neither a `java.lang.Integer` nor a `java.lang.Short`. Which overload is best suited for the task?

### Choosing the right overload (you make the choice!)

##### Strategy 1: Force execution of a named method

Using `java_send` you can specify which overload to use because it overrides JRuby's dispatch rules and looks for a method with the input signature you provide.


    # The 1st arg is the "method name"
    # The 2nd arg is the "input call signature"
    # The last args are the actual "input values"

    hssf_row.java_send(:createCell, [java.lang.Integer], 123) # => a new cell object


_NOTE: Since `java_send` relies on reflection, this strategy may yield poor performance._

##### Strategy 2: Grab the method you need

We can grab an unbound method off of our object using `java_method` and execute it directly. This provides us with a straightforward and efficient way to specify which overload we want to invoke.


    # We can choose our overload very similarly to how we invoke `java_send`

    unbound_method = hssf_row.java_method(:createCell, [java.lang.Intger])
    unbound_method.call(123) # => a new cell object


### Closing Thoughts

The strategies listed above will allow you to selectively invoke the desired version of a method on any Java objects you work with in your JRuby code. Please be aware that, while you can invoke methods on your objects using either camelcase or snakecase versions of method names (i.e. `row.createCreate` and `row.create_cell` are equivalent ), you must always use the camelcase version of a method name as a reference when using either `java_send` or `java_method`.
