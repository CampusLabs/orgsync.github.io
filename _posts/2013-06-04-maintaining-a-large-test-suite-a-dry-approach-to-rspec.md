---
title: Maintaining a Large Test Suite a DRY Approach to RSpec
layout: single
author: jpowell
comments: true
tags: testing patterns ruby rspec dry
description: More often than not, tests are treated as an afterthought or a second-class citizen. They are written to fulfill a requirement or to provide a mental safety net for the additions being made. After a while, the tests can become unmanageable. It may reach the point where updating them along with the business logic is such a daunting task that you stop writing tests altogether to meet deadlines.
---

More often than not, tests are treated as an afterthought or a second-class citizen. They are written to fulfill a requirement or to provide a mental safety net for the additions being made. After a while, the tests can become unmanageable. It may reach the point where updating them along with the business logic is such a daunting task that you stop writing tests altogether to meet deadlines.

For any piece of code, the aim should be for quality, clarity and extensibility. After all, tests are **code**. Why not approach them with the same mindset you would any other part of your codebase? There are many ways to maintain integrity of your test suite as well as keep things DRY. Let's run through a few use-case driven examples.

### Using common objects across units

In testing, instances of primary and secondary objects are needed. A lot of the time you will need similar instances with some conditional state. Let's look at a `User` spec:

{% highlight ruby %}
  # spec/models/user_spec.rb
  describe User do
    subject(:user) { create(:user) }
    let(:organization) { create(:organization) }

    describe '#accept_invite(invite)' do
      context 'invite is unacceptable' do
        let(:invite) {
          create(:invite,
                 :user => user,
                 :organization => organization)
        }
        # specs
      end

      context 'invite is for specific group' do
        let(:invite) {
          create(:invite, :with_group,
                 :user => user,
                 :organization => organization,
                 :email_address => 'test@mail.com')
        }
        # specs
      end
    end
  end
{% endhighlight %}

These examples use an `Invite` object created with some conditional properties and associations. We are using `factory_girl` which does some of the work for us, but there are a few things that we can abstract here. Here's another look at our example with some changes made:

{% highlight ruby %}
  # spec/models/user_spec.rb
  describe User do
    subject(:user) { create(:user) }
    let(:organization) { create(:organization) }

    def create_invite(*traits)
      attrs = traits.extract_options!
      traits.push({
        :user => user,
        :organization => organization
      }.merge(attrs))
      create(:invite, *traits)
    end

    describe '#accept_invite(invite)' do
      context 'invite is unacceptable' do
        let(:invite) { create_invite }
        # specs
      end

      context 'invite is for specific group' do
        let(:invite) {
          create_invite(:with_group, :email_address => 'test@mail.com')
        }
        # specs
      end
    end
  end
{% endhighlight %}

In this example, we've added a **helper method** `create_invite` which creates an `Invite` instance with some default attributes/associations. This method also allows us to customize the object by passing in argument(s):

  * traits for the factory
  * attributes/associations to override the defaults

This gives us both flexiblity and consistency accross our examples. What if we wanted to use this in our `Invite` spec also? Let's see how we can do that:

{% highlight ruby %}
  # spec/support/invite.rb
  shared_context 'invites' do
    let(:organization) { create(:organization) }

    def create_invite(user, *traits)
      attrs = traits.extract_options!
      traits.push({
        :user => user,
        :organization => organization
      }.merge(attrs))
      create(:invite, *traits)
    end
  end

  # spec/models/user_spec.rb
  describe User do
    subject(:user) { create(:user) }

    describe '#accept_invite(invite)' do
          include_context 'invites'

      context 'invite is unacceptable' do
        let(:invite) { create_invite(user) }
        # specs
      end

      context 'invite is for specific group' do
        let(:invite) {
          create_invite(user, :with_group, :email_address => 'test@mail.com')
        }
        # specs
      end
    end
  end

  # spec/models/invite_spec.rb
  describe Invite do
    include_context 'invites'

    let(:invite_user) { mock_model(User) }
    subject(:invite) { create_invite(invite_user) }
    # specs
  end
{% endhighlight %}

We moved the `organization` object and `create_invite` method into what RSpec calls a **shared context** and included it. Also, `user` was added as the first argument to `create_invite`, decoupling it from the example group. Shared contexts allow commonly used variables, methods and before/after hooks to be defined and included by any context(s).

### Testing mixins

Mixins are a pattern used for abstracting out common functionality that may be reused. Consider the following mixin and spec:

{% highlight ruby %}
  # app/concerns/commentable.rb
  module Commentable
    def add_comment(user, message)
      # code
    end
  end

  # spec/concerns/commentable.rb
  class CommentableTest
    include Commentable
  end

  describe CommentableTest do
    let(:user) { mock_model(User) }

    describe '#add_comment(user, message)' do
      it 'returns a comment' do
        expect(subject.add_comment(user, 'test comment')).to be_a(Comment)
      end
      # more specs
    end
  end
{% endhighlight %}

This gives us coverage on the concern, but what happens when we include the it in a class like this:

{% highlight ruby %}
  # app/models/news_post.rb
  class NewsPost
    include Commentable
    # more code
  end
{% endhighlight %}

Now we need to assert that a `NewsPost` instance has the behavior of `Commentable`. Let's update our specs and add one for the new class:

{% highlight ruby %}
  # spec/support/commentable.rb
  shared_examples Commentable do
    let(:user) { mock_model(User) }

    describe '#add_comment(user, message)' do
      it 'returns a comment' do
        expect(subject.add_comment(user, 'test comment')).to be_a(Comment)
      end
      # more specs
    end
  end

  # spec/concerns/commentable.rb
  class CommentableTest
    include Commentable
  end

  describe CommentableTest do
    it_behaves_like Commentable
  end

  # spec/models/news_post_spec.rb
  describe NewsPost do
    subject { create(:news_post) }

    it_behaves_like Commentable

    # more specs
  end
{% endhighlight %}

We are still covering our base case in the `Commentable` spec. Using a **shared example** here ensures all the classes that include the mixin are covered in regards to the default mixin behavior. Note that `it_behaves_like` includes the shared examples in a _nested_ context where as `include_examples` includes them in the _current_ context.

### Testing methods similar in behavior

Recently, I noticed a small issue with one of our permission checks being **more restrictive** than it should have been. After diagnosing the issue, I wrote specs for the method and added the check that was missing along the way. After committing, I submitted a pull request to be approved by a teammate before merging. Another developer on the team commented on the PR and asked why I didn't just add the spec to the pre-existing ones? _Sigh_. I had totally missed them because the specs were defined within a loop and the method names were being composed by string interpolation. Here is what the code looked like initially:

{% highlight ruby %}
  describe PermissionObject do
    # Defines each level of access, and the levels from which it inherits
    inheriting_access_levels = {
      'access' => %w(edit create access),
      'create' => %w(edit create),
      'edit'   => %w(edit)
    }

    inheriting_access_levels.each do |level, inherits_from|
      describe "#can_#{level}?" do
        # setup objects
        it 'access denied outside of organization' do
          # spec
        end

        context 'content in organization' do
          inherits_from.each do |inherited_level|
            # inherit level specs
          end

          it 'denies if has no access' do
            # spec
          end

          if level == 'edit'
            # edit specific specs
          end
        end
      end
    end
  end
{% endhighlight %}

This was an attempt to keep the specs DRY, but a clear case for using shared examples. If left this way, I would have been adding another if level == 'access' check before defining the example for my change. Let’s take a look at what’s there now:

{% highlight ruby %}
  describe PermissionObject do
    context 'permission checks' do
      # setup common objects

      shared_examples 'outside organization' do |method|
        # setup objects
        it 'access denied outside of organization' do
          # spec
        end
      end

      shared_examples 'content in organization' do |method, levels|
        # setup objects
        it 'denies if has no access' do
          # spec
        end

        levels.each do |level|
          # level specs
        end
      end

      describe '#can_access?' do
        it_behaves_like 'outside organization', :can_access?

        it_behaves_like 'content in organization', :can_access?, %w(edit create access) do
          # access specific specs
        end
      end

      describe '#can_create?' do
        it_behaves_like 'outside organization', :can_create?
        it_behaves_like 'content in organization', :can_create?, %w(edit create)
      end

      describe '#can_edit?' do
        it_behaves_like 'outside organization', :can_edit?

        it_behaves_like 'content in organization', :can_edit?, %w(edit) do
          # edit specific specs
        end
      end
    end
  end
{% endhighlight %}

With a simple structural refactor, we were able to keep the original tests while making them more explicit. Shared examples FTW! There are some things going on here worth noting:

- Shared example groups can take arguments
- Shared example groups can be extended using a block
- it_behaves_like allows examples to be included without conflicting in the namespace

### Testing driven by documentation

OrgSync has an API that allows clients to interact with our application. Documentation for the API is stored in config files. The template handler reads the data from them while displaying the docs pages. Wouldn’t it be awesome if we could just reuse that documentation in our specs? We did. Let’s check it out:

{% highlight ruby %}
  # spec/support/api.rb
  shared_examples 'api result hash keys' do |version, resource, action|
    KEYS = api_docs_yaml[version.to_s][resource.to_s][action.to_s]['returns']

    let(:result_hash) { JSON.parse(described_class.new(subject).to_json) }

    KEYS.each do |key|
      it "should have documented hash key '#{key}'" do
        expect(result_hash).to have_key(key)
      end
    end

    it 'should not have undocumented hash keys' do
      expect(result_hash.keys - KEYS).to be_empty
    end
  end

  # spec/serializers/classification_serializer_spec.rb
  describe ClassificationSerializer do
    subject { Classification.new }

    describe '#to_json' do
      include_examples 'api result hash keys', 'v2', 'classifications', 'index'
    end
  end
{% endhighlight %}
Here we have a shared example group that leverages the documented return values while testing our API serializers. These specs help to ensure that our API return values and our documentation are consistent. This is a great way to keep things DRY and maintain integrity in our application.

### Closing Thoughts
Testing is a must. Helper methods, shared examples, shared contexts and a mixture of them all can prove to be great tools in helping maintain a DRY test suite. The more you use them, the more creative ways you’ll come up with to leverage them. Let us know how you’re utilizing them.
