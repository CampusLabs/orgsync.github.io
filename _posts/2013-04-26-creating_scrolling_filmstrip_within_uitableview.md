---
title: Creating a Scrolling Filmstrip Within a UITableView
link: http://devblog.orgsync.com/creating_scrolling_filmstrip_within_uitableview/
author: macelangelo
comments: true
post_name: creating_scrolling_filmstrip_within_uitableview
tags: iOS
---

While working on our current project, our UI designer came up with a mockup that displayed photo albums as a small horizontal scrolling filmstrip within a single table cell of a larger table view.

Looking around the internet, I found several examples of a horizontal scrolling `UITableView` created inside another `UITableView`, much like the Pulse app. [Creating 'Pulse' style scrolling](http://iosstuff.wordpress.com/2011/06/29/creating-pulse-style-scrolling-horizontally-scrolling-uitableview-as-a-subview-of-uitableviewcell/)

You could do something along the same lines with a `UIScrollView`, but I thought using a `UICollectionView` might be a cleaner implementation. `UICollectionViews` are new as of iOS 6.0, and they give developers an elegant way to build grid views well beyond what `UITableView` is capable of.

Here's the basic rundown of how this works:

  * Create a normal `UITableView` with a custom `UITableViewCell`
  * Create a custom `UIView` that will be added to the cell's contentView
  * The custom `UIView` will contain a `UICollectionView`
  * The custom `UIView` will be the datasource and delegate for the `UICollectionView` and manage the flow layout of the `UICollectionView`
  * Use a custom `UICollectionViewCell` to handle the collection view data
  * Use `NSNotification` to notify the master controller's `UITableView` when a collection view cell has been selected and load the detail view.

Here's an image of what the view should look like:

![iOS_example_layout](/wp-content/uploads/2013/04/example_layout-149x300.png)

If you want to learn more about `UICollectionViews`, Ray Wenderlich has a great tutorial [Beginning UICollectionView In iOS 6](http://www.raywenderlich.com/22324/beginning-uicollectionview-in-ios-6-part-12). You can also watch the WWDC2012 videos _Introducing Collection Views_ and _Advanced Collection Views and Building Custom Layouts_ on iTunes.

Before I go into details, you can grab the sample project on github: [HorizontalCollectionViews](https://github.com/macelangelo/HorizontalCollectionViews)

Here's how to build this out:

**1) Create a new iOS project in Xcode.**

Select a Master/Detail application. Use automatic reference counting, but turn off storyboards and unit tests. This creates a project with both a master view controller and detail view controller. The master is a `UITableViewController`, which is exactly what we need to start with.

**2) Let's make some initial changes to the MasterViewController.**

For simplicity, change the `canEditRowAtIndexPath` method to return NO. Comment out the `commitEditingStyle...` method. Inside `viewDidLoad`, remove the code that adds `leftBarButtonItem` and `rightBarButtonItem`. You can also delete the `insertNewObject` method.

We need to set up sample data. In our example, each row will represent a collection of data. For each row, I'm using a dictionary that contains a title for the section heading. We'll use an array of strings as the data in the cell's collection view.

Inside MasterViewController, change the ivar _objects to an `NSArray`, then add the following code inside `viewDidLoad`.


    _objects = @[ @{ @"description": @"Section A",
                     @"articles": @[ @{ @"title": @"Article A1" },
                                          @{ @"title": @"Article A2" },
                                          @{ @"title": @"Article A3" },
                                          @{ @"title": @"Article A4" },
                                          @{ @"title": @"Article A5" }
                                          ]
                          },
                       @{ @"description": @"Section B",
                          @"articles": @[ @{ @"title": @"Article B1" },
                                          @{ @"title": @"Article B2" },
                                          @{ @"title": @"Article B3" },
                                          @{ @"title": @"Article B4" },
                                          @{ @"title": @"Article B5" }
                                          ]
                          },
                       @{ @"description": @"Section C",
                          @"articles": @[ @{ @"title": @"Article C1" },
                                          @{ @"title": @"Article C2" },
                                          @{ @"title": @"Article C3" },
                                          @{ @"title": @"Article C4" },
                                          @{ @"title": @"Article C5" }
                                          ]
                          },
                       @{ @"description": @"Section D",
                          @"articles": @[ @{ @"title": @"Article D1" },
                                          @{ @"title": @"Article D2" },
                                          @{ @"title": @"Article D3" },
                                          @{ @"title": @"Article D4" },
                                          @{ @"title": @"Article D5" }
                                          ]
                          }
                        ];


**3) Create a custom `UIView` and call it ContainerCellView. Create a nib file for it as well.**

This will be the custom content view that our `UITableViewCell` will use. It will also contain all of the logic for the `UICollectionVie`w.

View the nib file in Interface Builder. Go to the Attributes inspector, and set the size to be freeform and the status bar to none. Set the background color to white. Go to the size inspector and set the size to a width of 320 and a height of 180. Also, go to the Identity inspector and set the Class to your class name (ContainerCellView).

Next, drag a `UICollectionView` from the Data Objects panel onto the view. Let the collection view fill the view.

The custom view needs one public method called `setCollectionData` that accepts an `NSArray`.


    // ContainerCellView.h

    @interface ContainerCellView : UIView
    - (void)setCollectionData:(NSArray *)collectionData;
    @end


The ContainerCellView.m has a lot going on. We'll walk through each part.

Implement the `UICollectionViewDataSource` and `UICollectionViewDelegate` protocols. Create an `IBOutlet` property for the collection view. Create a property for the collection data.


    // ContainerCellView.m

    @interface ContainerCellView () <UICollectionViewDataSource, UICollectionViewDelegate>
    @property (weak, nonatomic) IBOutlet UICollectionView *collectionView;
    @property (strong, nonatomic) NSArray *collectionData;
    @end


Go back into IB and connect the `IBOutlet` from the ContainerCellView object to the `UICollectionView`. Set the ContainerCellView as the delegate for the `UICollectionView`, too.

Go back to ContainerCellView.m and add the following:


    - (void)awakeFromNib {
        self.collectionView.backgroundColor = [UIColor colorWithRed:204.0/255.0 green:204.0/255.0 blue:204.0/255.0 alpha:1.0];
        UICollectionViewFlowLayout *flowLayout = [[UICollectionViewFlowLayout alloc] init];
        flowLayout.scrollDirection = UICollectionViewScrollDirectionHorizontal;
        flowLayout.itemSize = CGSizeMake(130.0, 170.0);
        [self.collectionView setCollectionViewLayout:flowLayout];

        // Register the colleciton cell
