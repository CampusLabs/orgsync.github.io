---
title: REST API Integration Testing with Gatling
layout: single
author: justinsteffy
comments: true
tags: testing
description: I've decided to try a tool that is meant for stress/load testing; that tool is Gatling.
redirect_from: "/rest-api-integration-testing-with-gatling/"
---

In the world of [software testing](http://en.wikipedia.org/wiki/Software_testing), there are many types of tests and many tools to create them. Often the distinction among the types of tests is not always clear (e.g. integration, system, functional, acceptance). In this post, I am going to use the term "integration test" to denote a test that exercises the full end-to-end functionality of our system from a user's perspective.

I've decided to try a tool that is meant for stress/load testing; that tool is [Gatling](http://gatling-tool.org/). Why use a stress-testing tool to do integration tests? First of all, to perform integration tests the tool must allow us to specify requests to our API and validate the response. Most stress-testing tools have this sort of basic functionality, but Gatling allows us to go one step further: add load. Using a single simulated user exercise, our system will allow us to perform integration/system/acceptance testing. Adding hundreds or thousands of simulated users will allow us to perform stress/load testing. I hope to accomplish both with a single tool.

### Getting Started

Gatling is distributed as a zip or tarball and can be downloaded from [the homepage](http://gatling-tool.org/). It currently comes in two flavors: 2.0.0M1 and 1.4.7. This post will assume version 1.4.7, although the differences between the two may be minor.

Once you extract the archive, you will find a number of directories. Here is quick rundown:

  * bin - scripts to launch Gatling for your platform
  * conf - some configuration files I haven't had to mess with yet
  * lib - a bunch of jars to make Gatling run
  * results - empty at this point, but it will contain the results of your test runs
  * user-files - where you will place scripts and data
    * data - example csv files for [Feeders](https://github.com/excilys/gatling/wiki/Feeders)
    * simulation - the root for the scripts that will be run

Most of your work will go in the user-files directory. Now that we have the distribution, it's time to write some tests.

### Dev Setup

The [Gatling wiki on GitHub](https://github.com/excilys/gatling/wiki) has a good rundown on the basics of developing for Gatling. It provides a DSL for writing tests and there are some examples already in the user-files directory to get you started. You can start Gatling with a script from bin (e.g. `bin/gatling.sh` on *nix) and it will ask you a few questions about running tests to get you started. Eventually you will write your own test class and want to run it directly. This can be accomplished with the following:


    bin/gatling.sh -s my.SimulationClass # -s takes the classname of the test


Now you can edit your simulations and run using the above. What if there are errors in your simulation files? You will run the above and then get a compilation error. Rinse and repeat, but it's a little slow. Let's see if we can make it a little easier.

#### Set Up SBT

Until now, you may have noticed that I haven't once mentioned that Gatling and its test files are written in [Scala](http://www.scala-lang.org/). As stated on the [First Steps with Gatling](https://github.com/excilys/gatling/wiki/First-Steps-with-Gatling) wiki page:

> Yes, the Gatling simulation scripts are Scala classes.
>
> No, it won't be painful, Gatling doesn't expect you to be a hardcore Scala hacker, but just to read this manual so you can learn the DSL.

For me, this is actually a huge selling point. I love Scala and it is easily my favorite language. Since I've used it before, I figured I could improve the development situation using [SBT](http://www.scala-sbt.org/).

Why would a Scala build tool help us develop for Gatling? It provides a few features that will be useful:

  * Continuous compilation
  * Plugins for other development environments
    * Eclipse
    * IntelliJ IDEA
    * Netbeans
    * Sublime Text
    * [And much more...](http://www.scala-sbt.org/release/docs/Community/Community-Plugins)

In order to use this, we must first [install sbt](http://www.scala-sbt.org/release/docs/Getting-Started/Setup.html). I personally prefer to use the manual installation: download the jar, place it in the root of the Gatling distribution, and create an sbt script to launch it. This way you can have different versions of sbt per project and can more easily share it.

Due to the layout of the Gatling directory, sbt is almost going to "just work." We do need to create a build.sbt file in the root of the directory to describe our project to sbt. This is the file I am using:


    name := "orgsync-gatling"

    version := "0.1"

    scalaVersion := "2.9.3"

    scalaSource in Compile := file("./user-files/simulations/")


SBT already knows to look in the lib/ folder for unmanaged dependencies (i.e. the jars to compile against). We really only need to tell sbt where to find the source files, which are our simulation files using the `scalaSource in Compile` setting. At this point, you can try to compile your simulation:


    # compile the simulation files
    ./sbt compile

    # continuously compile the source
    ./sbt ~compile


If you use the tilde (`~`), then sbt will watch the directory and trigger a compilation when anything changes. This will give you much faster feedback about compilation errors in your simulation files.

#### Moving to Eclipse

Having sbt compile our code continuously is a solid win, but I miss having type information, auto-completion and the other features an IDE gives you. I personally use the [Scala IDE for Eclipse](http://scala-ide.org/), but you can use whatever dev environment works for you. Most likely there will be an sbt plugin to make it easy. I'm not going to cover setting up Eclipse for Scala development here, but you can check the [Scala IDE Download page](http://scala-ide.org/download/current.html). Please note that Gatling is using Scala version 2.9, so plan accordingly.

For our purposes, we just need to add a plugin to sbt in order to generate the Eclipse project files. The contents of this file will go in project/plugins.sbt under the Gatling root:


    addSbtPlugin("com.typesafe.sbteclipse" % "sbteclipse-plugin" % "2.1.2")


Now you can run `./sbt eclipse` to generate Eclipse project files, import the project into Eclipse, and edit the files with real-time compilation.

### Tweaks for Integration Tests

Gatling is built around the concepts of [simulations](https://github.com/excilys/gatling/wiki/Concepts#wiki-simulation), [scenarios](https://github.com/excilys/gatling/wiki/Concepts#what-is-a-scenario), [checks](https://github.com/excilys/gatling/wiki/Concepts#wiki-checks), and [assertions](https://github.com/excilys/gatling/wiki/Assertions). A simulation is a number of simulated users running through the various scenarios. Each scenario can make checks on each call, and at the end we can make some global assertions.

Since we aren't going for load, we can just use a single user per scenario. Each scenario will make a request to our API and verify the response. The common case will look something like:


    // tweaked from the docs
    http("My Request").get("myUrl").check(status.is(200), jsonPath("//valid").is("true"))
