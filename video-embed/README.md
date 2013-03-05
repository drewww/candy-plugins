# Video Embed

This plugin is designed to make it easy for moderators to designate a video for group viewing. Any YouTube video in the room topic will be captured and embedded in a resizable, draggable embedded video. 


## Usage

To enable the video embed plugin, include its javascript and css files.

```HTML
<script type="text/javascript" src="candyshop/roomPanel/roomPanel.js"></script>
<link rel="stylesheet" type="text/css" href="candyshop/roomPanel/default.css" />
```

Then call its `init()` method: 

```JavaScript
CandyShop.Videoembed.init();
````

Now you'll need to set the topic/subject of the room with the video URL. As far as I know, this requires logging into your jabber server with a third party client that has a UI for jabber administrative features. Most jabber clients should have the ability to set the topic. Change the topic to a string that includes a YouTube URL. You might need to clean up the URL a bit if it's got a bunch of junk in it and it's not getting recognized properly. Also, including two YouTube URLs in the same topic will cause the second one to be embedded.

## Draggability

IF you'd like to be able to drag the video embed around, you can include the jQuery UI draggable functionality in your page. The library is available at [http://jqueryui.com/](jqueryui.com). This plugin doesn't require that library, but draggability will be automatically disabled if it's not present.