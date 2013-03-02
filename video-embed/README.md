# Video Embed

This plugin is designed to make it easy for moderators to designate a video for group viewing. The moderator puts the URL in the room subject (with the form "VIDEO: http://videourl/"). Clients will then embed that video at the top of their chat window.


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

Now you'll need to set the topic/subject of the room with the video URL. As far as I know, this requires logging into your jabber server with a third party client that has a UI for jabber administrative features. Most jabber clients should have the ability to set the topic. Change the topic to a string that includes "VIDEO: " followed by a stream URL. For now, this plugin supports only Youtube streaming embeds. Later versions will support more elaborate functionality. 
