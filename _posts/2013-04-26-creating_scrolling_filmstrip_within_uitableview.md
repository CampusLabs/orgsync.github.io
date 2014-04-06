---
title: Creating a Scrolling Filmstrip Within a UITableView
layout: single
author: macelangelo
comments: true
tags: iOS
description: While working on our current project, our UI designer came up with a mockup that displayed photo albums as a small horizontal scrolling filmstrip within a single table cell of a larger table view.
redirect_from: "/creating_scrolling_filmstrip_within_uitableview/"
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

![iOS_example_layout](http://cl.ly/image/3h3v1D1X2q2g/Screen%20Shot%202014-04-05%20at%207.09.47%20PM.png)

If you want to learn more about `UICollectionViews`, Ray Wenderlich has a great tutorial [Beginning UICollectionView In iOS 6](http://www.raywenderlich.com/22324/beginning-uicollectionview-in-ios-6-part-12). You can also watch the WWDC2012 videos _Introducing Collection Views_ and _Advanced Collection Views and Building Custom Layouts_ on iTunes.

Before I go into details, you can grab the sample project on github: [HorizontalCollectionViews](https://github.com/macelangelo/HorizontalCollectionViews)

Here's how to build this out:

#### 1) Create a new iOS project in Xcode.

Select a Master/Detail application. Use automatic reference counting, but turn off storyboards and unit tests. This creates a project with both a master view controller and detail view controller. The master is a `UITableViewController`, which is exactly what we need to start with.

#### 2) Let's make some initial changes to the MasterViewController.

For simplicity, change the `canEditRowAtIndexPath` method to return NO. Comment out the `commitEditingStyle...` method. Inside `viewDidLoad`, remove the code that adds `leftBarButtonItem` and `rightBarButtonItem`. You can also delete the `insertNewObject` method.

We need to set up sample data. In our example, each row will represent a collection of data. For each row, I'm using a dictionary that contains a title for the section heading. We'll use an array of strings as the data in the cell's collection view.

Inside MasterViewController, change the ivar _objects to an `NSArray`, then add the following code inside `viewDidLoad`.

{% highlight objective-c %}
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
{% endhighlight %}

#### 3) Create a custom `UIView` and call it ContainerCellView. Create a nib file for it as well.

This will be the custom content view that our `UITableViewCell` will use. It will also contain all of the logic for the `UICollectionVie`w.

View the nib file in Interface Builder. Go to the Attributes inspector, and set the size to be freeform and the status bar to none. Set the background color to white. Go to the size inspector and set the size to a width of 320 and a height of 180. Also, go to the Identity inspector and set the Class to your class name (ContainerCellView).

Next, drag a `UICollectionView` from the Data Objects panel onto the view. Let the collection view fill the view.

The custom view needs one public method called `setCollectionData` that accepts an `NSArray`.

{% highlight objective-c %}
  // ContainerCellView.h

  @interface ContainerCellView : UIView
  - (void)setCollectionData:(NSArray *)collectionData;
  @end
{% endhighlight %}

The ContainerCellView.m has a lot going on. We'll walk through each part.

Implement the `UICollectionViewDataSource` and `UICollectionViewDelegate` protocols. Create an `IBOutlet` property for the collection view. Create a property for the collection data.

{% highlight objective-c %}
  // ContainerCellView.m

  @interface ContainerCellView () <UICollectionViewDataSource, UICollectionViewDelegate>
  @property (weak, nonatomic) IBOutlet UICollectionView *collectionView;
  @property (strong, nonatomic) NSArray *collectionData;
  @end
{% endhighlight %}

Go back into IB and connect the `IBOutlet` from the ContainerCellView object to the `UICollectionView`. Set the ContainerCellView as the delegate for the `UICollectionView`, too.

Go back to ContainerCellView.m and add the following:

{% highlight objective-c %}
  - (void)awakeFromNib {
      self.collectionView.backgroundColor = [UIColor colorWithRed:204.0/255.0 green:204.0/255.0 blue:204.0/255.0 alpha:1.0];
      UICollectionViewFlowLayout *flowLayout = [[UICollectionViewFlowLayout alloc] init];
      flowLayout.scrollDirection = UICollectionViewScrollDirectionHorizontal;
      flowLayout.itemSize = CGSizeMake(130.0, 170.0);
      [self.collectionView setCollectionViewLayout:flowLayout];

      // Register the collection cell
      [_collectionView registerNib:[UINib nibWithNibName:@"ArticleCollectionViewCell" bundle:nil] forCellWithReuseIdentifier:@"ArticleCollectionViewCell"];
    }
{% endhighlight %}

The method awakeFromNib does a couple of things. It sets the background of the collectionView. It also registers a custom collectionViewCell with the collection view. This is something new with iOS6, and it allows you to register any custom cell views with a table or collection view. It simplifies the code when you get into the cellForRowAtIndexPath method. If you’re using a nib file, you’ll have to make sure to set the Reuse Identifier in IB.

It also creates a UICollectionViewFlowLayout and sets both the item size and scroll direction. UICollectionViewFlowLayout is one aspect where UICollectionView varies from UITableView. You have a couple of approaches to using a flow layout, but you must have one. You can define one in code and set the properties like I have above. Or, you can use the UICollectionViewDelegateFlowLayout protocol and configure layout properties at runtime.

Next, we need to implement the setCollectionData method. This will set the collection view data, and then reload the collection view.

{% highlight objective-c %}
- (void)setCollectionData:(NSArray *)collectionData {
    _collectionData = collectionData;
    [_collectionView setContentOffset:CGPointZero animated:NO];
    [_collectionView reloadData];
}
{% endhighlight %}

Next, implement the UICollectionViewDataSource methods. Set the number of sections to 1. Set the numberOfItemsInSection to be the collectionData count. Then implement cellForItemAtIndexPath.

{% highlight objective-c %}
- (UICollectionViewCell *)collectionView:(UICollectionView *)collectionView cellForItemAtIndexPath:(NSIndexPath *)indexPath {
    ArticleCollectionViewCell *cell = [collectionView dequeueReusableCellWithReuseIdentifier:@"ArticleCollectionViewCell" forIndexPath:indexPath];
    NSDictionary *cellData = [self.collectionData objectAtIndex:[indexPath row]];
    cell.articleTitle.text = [cellData objectForKey:@"title"];
    return cell;
}
{% endhighlight %}

In the above code, I’m getting the custom UICollectionViewCell that I registered in awakeFromNib. Since I registered it, there’s no longer a need to check for nil here.

#### 4) Create a custom UICollectionViewCell and call it ArticleCollectionViewCell. Create a custom nib file for it as well.

Set the size of the cell to be 130×170. Add a UILabel to the cell (I called mine articleTitle). Be sure to create a public IBOutlet property for the label and wire it up in IB. Also in IB, make sure to set the Class name to your class name (in my case, ArticleCollectionViewCell) and the reuse identifier to your class name.

#### 5) Create a custom UITableViewCell and call it ContainerTableCell.

This is the custom cell our MasterViewController table view will use. We need to do a couple of things here.

Add a public method called setCollectionData that takes an NSArray to the interface.
Add a private strong property for a UIView. I’ve called mine collectionView. This will be a reference to the custom UIView that will contain the collection.
Implement setCollectionData.
Here’s the code:

{% highlight objective-c %}
// ContainerTableCell.m

- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier {
    self = [super initWithStyle:style reuseIdentifier:reuseIdentifier];
    if (self) {
        // Initialization code
        _collectionView = [[NSBundle mainBundle] loadNibNamed:@"ContainerCellView" owner:self options:nil][0];
        _collectionView.frame = self.bounds;
        [self.contentView addSubview:_collectionView];
    }
    return self;
}
- (void)setCollectionData:(NSArray *)collectionData {
    [_collectionView setCollectionData:collectionData];
}
{% endhighlight %}
The initWithStyle just loads our custom view from the nib file. Then we add it to the table cell’s contentView. setCollectionData hands the array of data off to the collectionView.

#### 6) Wire things up to the MasterViewController.

So, first we need to register our custom container cell with the MasterControllerView’s tableView. So add this line into viewDidLoad.

{% highlight objective-c %}
// MasterViewController.m

// Register the table cell
[self.tableView registerClass:[ContainerTableCell class] forCellReuseIdentifier:@"ContainerTableCell"];
{% endhighlight %}
Because we created the custom containerCell without a nib file, we register the class.

Next, update all of the UITableViewDataSource and delegate methods. For fun, I’m pulling the description property and using that as the section header of the table cells. Each row will be a separate custom cell with a UICollectionView inside it.

{% highlight objective-c %}
// MasterViewController.m

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    return [_objects count]; // Total number of rows in the sample data.
}
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return 1;  // Only one "row" per section - with the NSArray of article titles
}
// Customize the appearance of table view cells.
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    ContainerTableCell *cell = [tableView dequeueReusableCellWithIdentifier:@"ContainerTableCell"];
    NSDictionary *cellData = [_objects objectAtIndex:[indexPath section]];  // Note we're using section, not row here
    NSArray *articleData = [cellData objectForKey:@"articles"];
    [cell setCollectionData:articleData];
    return cell;
}

#pragma mark UITableViewDelegate methods
- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section {
    NSDictionary *sectionData = [_objects objectAtIndex:section];
    NSString *header = [sectionData objectForKey:@"description"];
    return header;
}
- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section {
    return 20.0;
}
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath {
    return 180.0;
}
{% endhighlight %}

The snippets include everything for the cell and the section headers.

#### 7) Test it out!

If you have all of this set up and run, you should see something like the image at the beginning of the article. If not, here are a few things to check:

Make sure the containerTableCell initialized the containerView and add it to the cell’s contentView.
Check that you’re getting the list of articles for the table row.
Check that the list of articles is getting passed down to the containerCell via setCollectionData:.
Make sure the UICollectionView is correctly connected to the containerView and that the containerView is the datesource and delegate
8) Selecting a CollectionViewCell

Now, you want to be able to select a collection view cell and pass the cell’s data back up to the MasterViewController so it can send that data to the DetailViewController.

I chose to do this with NSNotifications, but you could also set the MasterViewController as the UICollectionView’s delegate. To set things up with notifications, here’s what I did:

Inside MasterViewController, I set up the observer for the notification in viewDidLoad.

{% highlight objective-c %}
// Add observer that will allow the nested collection cell to trigger the view controller select row at index path
[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didSelectItemFromCollectionView:) name:@"didSelectItemFromCollectionView" object:nil];
{% endhighlight %}
Then I commented out the code for didSelectRowAtIndexPath. If you leave this code in, you’ll always select the table view cell, not the individual collection view cell.

I also set up the selector method that looks for the dictionary of cellData and passes it to the detailViewController. I then have the navigation controller load the detailViewController.

{% highlight objective-c %}
// MasterViewController.m

- (void) didSelectItemFromCollectionView:(NSNotification *)notification {
    NSDictionary *cellData = [notification object];
    if (cellData) {
        if (!self.detailViewController) {
        self.detailViewController = [[DetailViewController alloc] initWithNibName:@"DetailViewController" bundle:nil];
        }
        self.detailViewController.detailItem = cellData;
        [self.navigationController pushViewController:self.detailViewController animated:YES];
    }
}
{% endhighlight %}
Then, I implemented the didSelectItemAtIndexPath method inside the containerView. This posts a NSNotification and sends the current cell’s data.

{% highlight objective-c %}
// ContainerCellView.m

- (void)collectionView:(UICollectionView *)collectionView didSelectItemAtIndexPath:(NSIndexPath *)indexPath {
    NSDictionary *cellData = [self.collectionData objectAtIndex:[indexPath row]];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"didSelectItemFromCollectionView" object:cellData];
}
{% endhighlight %}
Finally, I updated the configureView method of the detailViewController to pull the title from the data.

{% highlight objective-c %}
// DetailViewController.m

- (void)configureView {
    // Update the user interface for the detail item.
    if (self.detailItem) {
        self.detailDescriptionLabel.text = self.detailItem[@"title"];
    }
}
{% endhighlight %}

That’s it! If you had everything working before, running the app now should allow you to select a specific article cell, and the detail view should show the title you selected.

Using UICollectionViews inside UITableViews may not be something Apple intended us to do, but it does create some interesting ideas for laying out complex sets of data.

Feel free to grab the example project and take a look at it: [HorizontalCollectionViews](https://github.com/macelangelo/HorizontalCollectionViews)
