---
title: Stubbing External Service Calls with RSpec
link: http://devblog.orgsync.com/stubbing-external-service-calls-with-rspec/
author: jpowell
comments: true
post_name: stubbing-external-service-calls-with-rspec
tags: testing
---

When building complex web applications, you'll find there are business needs that require integrating with external services. In other cases, it may be more feasible to leverage a pre-existing service instead of reinventing the wheel.

Recently we had to extend the functionality of one of our models. In TDD fashion, I wrote some failing specs and made them pass. After finishing the additions, I ran all the specs for the models that had been changed. The output read:


    Finished in 1 minute 17.31 seconds
    32 examples, 0 failures


As you can see, these specs were executing very slowly. I began to profile and inspect the examples further to see if there was any low-hanging fruit (profiling with `rspec -p` comes in handy). After further investigation, I found that the model was making calls to Amazon's S3, sometimes multiple per example, like so:


    # called on instantiation of every record
    AWS::S3::S3Object.store(...)
    # called in #copy
    AWS::S3::S3Object.copy(...)


It was immediately apparent that we needed to stub out the calls to S3. Since we utilize S3 in a few places, I thought it would make sense to define a `shared_context` so that it can be reused. Here it is:


    shared_context 'stub s3' do
      def stub_s3(method, success = true)
        AWS::S3::S3Object.stub(method).
          and_return(double('response', :success? => success))
      end
    end


The above context defines a helper that stubs out the S3 method name you pass as the first argument. Optionally, you can pass the return value of the `success?` method of the S3 response as the second argument (default is `true`). With this in place, we can now include the context and specify the methods we want to stub in the correct context.


    describe Upload do
      include_context 'stub s3'
      before(:each) { stub_s3(:store) }

      describe '#copy' do
        before(:each) { stub_s3(:copy) }
        # more specs
      end
      # more specs
    end


After stubbing out the calls to S3, I ran the same specs again.


    Finished in 36.22 seconds
    32 examples, 0 failures


We have a 2.1x speed increase for these specs and a testing infrastructure piece in place that can be reused. Overall, it is generally optimal to mock interactions with external services when testing, unless you are testing the endpoints themselves.

(These specs are still really slow and could be optimized, but we'll cover that at a later date.) Comments and feedback are always welcome.

Referenced:

  * rspec (2.12.0)
  * aws-s3 (0.6.2)
