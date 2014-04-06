---
title: Recap of CocoaConf Dallas
layout: single
author: macelangelo
comments: true
tags: iOS community
description: In the last couple of years, several independent developer conferences have sprung up to help share knowledge about iOS and Mac development with the community, and CocoaConf is one of them. Since late 2011, CocoaConf, presented by Dave Klein, takes a unique approach by hosting multiple shows in both spring and fall in cities around the country.
---

Apple's Worldwide Developer Conference (WWDC) has traditionally been the primary source of information about the latest in iOS and Mac development, as well as one of the rare chances for developers of small or one-man shops to meet their peers. Getting a "golden ticket" to WWDC, however, becomes harder each year as the conference quickly sells out. (Last year's 5,000 tickets sold out in under two hours).

In the last couple of years, several independent developer conferences have sprung up to help share knowledge about iOS and Mac development with the community, and CocoaConf is one of them. Since late 2011, [CocoaConf](http://www.cocoaconf.com/), presented by Dave Klein, takes a unique approach by hosting multiple shows in both spring and fall in cities around the country.

Last week's CocoaConf Dallas was the first time for the conference to be in Dallas, and it's the first iOS/Mac OS conference that I know of to be in the city. The conference is a three-day show, with the first day providing all-day training sessions in either Core Graphics or an iOS Tutorial. The next two days are chock full of sessions spread across three rooms. All of the speakers come from the developer community, and a few are former Apple employees. Here's just a brief rundown of a handful of the sessions in Dallas:

  * Daniel Pasco, CEO of [Black Pixel](http://www.blackpixel.com/), opened the conference with a keynote about the leassons learned as Black Pixel started the long transition from a client-focused company to a product-focused one.

  * Conrad Stohl from Mutual Mobile in Austin presented a talk on using Core Data and Web Services. He announced the release of [MMRecord](https://github.com/mutualmobile/MMRecord), which quickly converts the data response from a webservice API into a collection of NSManagedObjects.

  * Doug Sjoquist covered [CocoaPods](http://cocoapods.org/), which provides a solution for managing library dependencies for both Mac OS and iOS. Think of it as Bundler for Objective-C.

  * Sjoquist also gave a great presentation about using behavior driven development in Objective-C with the help of [Kiwi](https://github.com/allending/Kiwi), a library built on top of OCUnit that allows users to write RSpec-like unit tests.

  * Kevin Harwood from Mutual Mobile peeled back the layers behind [AFNetworking](https://github.com/AFNetworking/AFNetworking) to give an overview of how it works as well as present a quick preview of what's coming in 2.0. AFNetworking is an elegant networking library built on top of NSURLConnection and NSOperation.

  * Patrick Burleson of BitBQ went into detail about a number of tools, tips, and tricks designed to help automate developer's workflow. Being able to automate some of these tasks decreases the risk of breaking things because you forgot a step by doing the task manually. Some of the tips included using [TextExpander](http://smilesoftware.com/TextExpander/index.html) to create keyboard shortcuts for things you type all the time, re-generating Core Data model files using [mogenerator](http://rentzsch.github.io/mogenerator/), automating builds and distributions with shenzhen, and using [Jenkins](http://jenkins-ci.org/) to create a build server.

  * Indie developer and author Bill Dudney gave an excellent detailed run-through on how to use XCode's Instruments to tune the performance of applications as well as several aspects of performance to check.

  * Cesare Rocchi of Studio Magnolia presented an overview of AutoLayout and how using it requires a different way of thinking about presenting your views. He covered setting things up through Interface Builder, adding constraints in code and creating constraints using Apple's visual ASCII syntax.

All of the sessions were very well done and contained a great deal of information. With so many intriguing sessions, I found it hard to pick just one session to attend. Unfortunately, the sessions were not recorded so the decision was that much harder.

The hotel location was near the center of the DFW metroplex and close to DFW airport. The internet access was okay (I haven't been to conference yet where having a large number of developers did not crush the venue's wifi), but the food was great. The only downside to the hotel had limited locations nearby for dining or socializing, so carpooling to dinner was a necessity. That's no fault of the conference, merely a byproduct of the suburban sprawl of DFW.

Another great aspect of the independent conferences is that they're much smaller, giving you a better chance to meet and get to know other developers. Many of the well-known developers in the community attend or present at these conferences as well. I was pleasantly surprised by the large number of local developers attending. Austin may be the better-known location for iOS development outside of Silicon Valley, but there's a pretty decent contingent in Dallas as well.

It was a great conference with informative sessions and a chance to see old friends and make new ones.

Overall, if you miss out on getting a ticket to WWDC, you should definitely check out one of the CocoaConfs closest to your area.
