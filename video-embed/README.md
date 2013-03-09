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

## Video Controls

By default, clients will load whatever video is in the topic string. They will be required to start it manually. For videos that are live streams, this works great - everyone is synchronized automatically by YouTube. But for traditional YouTube videos, synchronization is a somewhat harder problem.

This plugin handles these issues by providing a set of tools for moderators to control the playback of all clients simultaneously. This is quite clumsy, but is the best we can do easily without relying on a bot or some other bit of logic. 

Commands _must_ be sent from a moderator user. Commands from any other user role will be ignored. Any command that includes /video will not be shown to users; their clients will automatically process it and hide it. The commands are as follows:

 * `/video start` - Start clients playing at wherever their playheads are at the moment.
 * `/video stop` - Pause all clients' playback.
 * `/video time mm:ss` - Forces all clients to move to the specified point in time. Auto-starts playback from that point. This is the preferred way to start clients playing at the start of a clip, too - for some reason, youtube videos frequently will default to starting somewhere in the middle if you call playVideo() on a stopped video. Not sure why this is. /view time 00:00 will reliably start at the beginning on all clients.
 * `/video catchup mm:ss` - For clients that are synchronized (ie within a few seconds of the target time), this is ignored. For clients whose players are stopped, or are who at dramatically different points in time, this command will bring them to the right point in the video. To check the current video time, open the console - the video will periodically (every 10 seconds) output the current timestamp. This is obnoxious, I know, but it'll have to do for now.

For times longer than an hour, continue to specify the time in minutes, eg 1:20:33 should be specified as 80:33.

The core challenging with synchronizing is that we don't want to be updating the topic constantly with the current synchronized time. Ideally, we would have a bot that would pulse the current timestamp to users who join, but that's not the domain of a plugin alone. So instead, we'll figure that most people show up in advance of some event, and if we start/stop at the same times, they'll be more or less in the right place. For users that arrive late, the moderator should use `/video catchup` and include the current time from their video player. This will bring the late-comer up to speed. This is pretty labor intensive, but it's a start. It also makes it easy to build a bot later that manages this process for you automatically.
