---
title: Frictionless Project Organization for iOS
link: http://devblog.orgsync.com/frictionless-project-organization-for-ios/
layout: single
author: camdez
comments: true
post_name: frictionless-project-organization-for-ios
tags: iOS
---

There comes a time in every MVC(-ish) app's life when it starts to get a bit heavy. Sure, a few out-of-place lines of code here or there don't hurt too much when the codebase is young and agile, but in a middle-aged app they start to be a concern. Slovenly habits beget more slovenly habits; refactorings don't come as easily as they used to. And before you know it, your methods won't even fit on a standard-size Cinema Display anymore. Something's gotta give.

Rails developers talk a lot about this problem1. Should we have fat models and skinny controllers? Or skinny models and fat controllers? (No one really talks about views because we're all in agreement that we shouldn't be hiding our complexity _there_). But personally, I'm convinced that a lot of this problem comes down to nomenclature; specifically the nebulousness of the word "model."

The problem with the term "model" is that it's overloaded to mean two different things—things we'd often like to distinguish between, viz. (1) our [business objects](http://en.wikipedia.org/wiki/Business_object) (the actual entities in the domain of the problem we're trying to solve, be they `Orders`, `Widgets`, or `BlogPosts`) and (2) anything in the logic layer of our application. Is (say) a `CurrencyFormatter` a model? _Depends on who you ask._

The secret to escaping MVC bloat is to take code out of both your controllers _and_ your (business object) models and put it into other lightweight, coordinating objects. Make decorators, presenters, services, translators, interpreters, wrappers, and sometimes even—(gods have mercy)—factories. These objects are comprehensible, testable, and maybe even reusable. And they reduce the surface area of each object's API so you can wrap your head around it. As a very smart man2 once said, _the only way to deal with complexity is to eliminate it_.

But when we decide to extract these objects, where do we put them in our codebase? Where should a `GrueFrobnicator` live? In the Rails world [the gods](http://rubyonrails.org/core) have seen fit to give us the `app/models`, `app/views`, and `app/controllers` directories which, while handy, suffer from one major problem: **when all you have is models, views and controllers, everything looks like one of them.**

Do these misfits _belong_ in `app/models`? `lib`? Elsewhere? I remember being a beginner and wondering if I could even add classes to `app/models` which didn't inherit from `ActiveRecord::Base`. Could I make an `app/frobnicators` directory? (Hint: both of these work). _Should I?_ That's a tougher question.

What all of this amounts to is _friction_. And **every time we hesitate about the _right_ place to put our code, we raise our chances of leaving it in a very wrong place.**

In the iOS development world we have none of this. The default project organization scheme is `Supporting Files` and _everything else_ (which, honestly, sounds a lot like _blah_ and _blah_ to me). _Thanks, Xcode_. But maybe that's not all bad. I mean, no scheme is better than a broken one.

So one day I spent way too long on the [C2 wiki](http://c2.com/cgi/wiki), thinking about names and trying different variations, and I what I eventually came up with was the deceptively-simple formula I'm now using for all of my new projects:


    $ mkdir -p ProjectName/{Assets/Images,Frameworks,Logic/Models,Presentation/View{,Controller}s}
    $ find ProjectName -type d
    ProjectName
    ProjectName/Assets
    ProjectName/Assets/Images
    ProjectName/Frameworks
    ProjectName/Logic
    ProjectName/Logic/Models
    ProjectName/Presentation
    ProjectName/Presentation/ViewControllers
    ProjectName/Presentation/Views


It's fairly self-explanatory. The pieces worth calling out are:

  1. `Frameworks` — External libraries bundled into the project (not core iOS `.framework` files, however, which still live in the top-level `Frameworks` group in Xcode).
  2. `Logic/Models` — "Business object" style models. We're never going to get everyone to agree on what the term should mean, but nesting it under `Logic` makes it clear in this case.

**Here's why I think this helps:**

  * _(Nearly) everything has an obvious place to live._ The containing `Logic` and `Presentation` directories are easy targets because they're broad in scope. It's usually not hard to distinguish between core logic code and presentation code, and if it doesn't belong in a more specific subfolder, leave it there.
  * The critical separation between view controllers3 and business logic is explicit.
  * Finally, when you notice objects of particular kind accumulating, _make a new subdirectory_. Add `Logic/Serializers` or `Presentation/Cells` when the need becomes clear.

I've been using this structure for several weeks now and I'm still quite happy with it. What do you think? I'd love to hear from others who have tried this scheme or have other project organization schemes they love.

### Footnotes

  1. Regretably I don't hear iOS developers talk that much about software design even though we face many of the same problems.
  2. I could have sworn this was Rich Hickey but I can't find the quote. In any case, he nearly says as much in his [Simple Made Easy](http://www.infoq.com/presentations/Simple-Made-Easy) talk when he discusses (human) limits. Consider that your appeal to authority.
  3. Or even views, if you're walking that dark path.
