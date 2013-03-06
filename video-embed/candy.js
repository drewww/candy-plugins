/*
 * candy-video-embed-plugin
 * @version 0.1 (2013-03-02)
 * @author Drew Harry (drew.harry@gmail.com)
 *
 * Makes it easy for administrators to embed video streams for the audience to
 * co-watch.
 * 
 */
 
var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.VideoEmbed = (function(self, Candy, $) {

	self.init = function() {
    // sign up for onSubjectChange notifications
    Candy.View.Event.Room.onSubjectChange = handleSubjectChange;
    
    // sign up for admin messages (which will start/stop video later)
    Candy.View.Event.Chat.onAdminMessage = handleAdminMessage;
    
    Candy.View.Event.Message.beforeShow = handleVideoMessage;
    
    // include the youtube JS api per docs:
    // https://developers.google.com/youtube/iframe_api_reference
    var tag = document.createElement('script');
    tag.src = "//www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
    self.youtubeApiAvailable = false;
    window.onYouTubeIframeAPIReady = function(playerId) {
      self.youtubeApiAvailable = true;
    }
    
    // we'll keep track of the player objects on a per
    // roomJid basis
    self.players = {};
    
    self.dimensions = {
	    "small":{width:284, height:160},
	    "medium":{width:400, height:225},
	    "large":{width:533, height:300},
	  };
	  
    
    return self;
	};
	
	var handleSubjectChange = function(args) {
	  // args is {roomJid, element, subject}
    var subjectPieces = args.subject.split(" ");
    
    // now loop through the pieces looking for video.
    var foundVideo = false;
    for(var i=0; i<subjectPieces.length; i++) {
      var piece = subjectPieces[i];
      
      var videoId = extractYoutubeId(piece);
        
      if(!videoId) {
        continue;
      } else {
        foundVideo = true;
        createOrUpdateEmbed(videoId, args.roomJid);
        break;
      }
    }
    
    if(!foundVideo) {
      hideEmbed(true);
    } else {
      showEmbed(true);
    }
	};
	
	// per answers here: http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url
	var extractYoutubeId = function(youtubeURL) {
	  var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
    var match = youtubeURL.match(regExp);
    if (match&&match[2].length==11){
        return match[2];
    }else{
      return false;
    }
	};
	
	var hideEmbed = function(fullHide) {
	  if(fullHide) {
	    $(".video-embed").hide();
	  }
	  
    $(".video-embed iframe").hide();
    
    // change the close button to an open button.
    $(".video-embed .close").hide();
    $(".video-embed .open").show();
	};
	
	var showEmbed = function(fullShow) {
	  if(fullShow) {
	    $(".video-embed").show();
	  }

    $(".video-embed iframe").show();
    $(".video-embed .close").show();
    $(".video-embed .open").hide();
	};
	
	var sizeEmbed = function(size) {
	  // size should be 's', 'm', or 'l'
	  var dimensions = self.dimensions;
	  
	  if(!size in dimensions) {
	    // invalid size, not 's', 'm', or 'l'
	    return;
	  }
	  
	  $(".video-embed iframe").attr("width", dimensions[size].width);
	  $(".video-embed iframe").attr("height", dimensions[size].height);
	  $(".video-embed").css("width", dimensions[size].width);
	  
	  $(".video-embed .selected").removeClass("selected");
	  $(".video-embed #" + size).addClass("selected");
	};
	
	var createOrUpdateEmbed = function(videoId, roomJid) {
	  // check and see if the video embed exists already. if it does, 
	  // update the embed src. if it doesn't, create it with the right src.
	  var embed;
	  if($(".video-embed").length>0) {
	    embed = $(".video-embed");
	    embed.find("iframe").attr("src", "http://www.youtube.com/embed/" + videoId + '?rel=0');
	  } else {
	    
	    // TODO make it easy to show/hide the embed for users that don't
	    // want to see it.
	    // TODO see what happens when we turn rooms on
	    
      $("#chat-rooms").prepend($('<div class="video-embed"><h1>Current Room Video</h1><div class="close"><img src="candy-plugins/video-embed/img/bullet_arrow_up.png"></div><div class="open"><img src="candy-plugins/video-embed/img/bullet_arrow_down.png"></div><div class="size selected" id="large">L</div><div class="size" id="medium">M</div><div class="size" id="small">S</div><div id="player"></div><br class="clear"></div>'));
      
      // check to see if youtube api is available?
      if(!self.youtubeApiAvailable) {
        console.log("YouTube API failed to load in time. Cannot embed videos.");
        // TODO we should wait a little and try again. But really, this can
        // only happen if the user manages to log in and start getting data
        // before we manage to asynchronously load the YT lib. Bit of a 
        // reach.
      }
      
      // now use the youtube api to embed the video
      self.players[roomJid] = new YT.Player('player', {
        height: self.dimensions['large'].height,
        width: self.dimensions['large'].width,
        videoId: videoId,
        events: {
          "onReady": function(args) { console.log("onReady");},
          "onStateChange": function(args) {console.log("onStateChange");},
        }
      });
      
      $(".video-embed .close").click(function() {
        hideEmbed();
      });
      
      $(".video-embed .open").click(function() {
        showEmbed();
      });
      
      $(".video-embed #small").click(function() {
        sizeEmbed("small");
      });
      
      $(".video-embed #medium").click(function() {
        sizeEmbed("medium");
      });
      
      $(".video-embed #large").click(function() {
        sizeEmbed("large");
      });
      
      // if the jquery draggable behavior seems to exist, make the 
      // embed draggable.
      var embedEl = $(".video-embed");
      
      if(embedEl.draggable !== undefined) {
        embedEl.draggable();
        embedEl.css("cursor", "move");
      }
	  }
	  
	};
	
	var handleVideoMessage = function(args) {
	  // args is {roomJid, nick, message}
	  
	  console.log(args.roomJid + ": " + args.message);
	  
	  // returning an empty string causes the message to get tossed out
	  // this is perfect!
    // return "";
    
    // extract the user object, given the nick we have
    var user;
    if(args.roomJid in Candy.Core.getRooms()) {
	    user = Candy.Core.getRooms()[args.roomJid].roster.get(args.roomJid + "/" + args.nick);
	  }
	  
	  if(user!==undefined) {
	    // okay, given the user object exists, check and see if they're a 
	    // moderator.
      if(user.getRole()==user.ROLE_MODERATOR) {
        console.log("message from moderator: " + args.message);
        // if it's a moderator user, inspect the message to see if we need
        // to respond.
        var msg = args.message;
        
        if(msg.indexOf("/video")==0) {
          // look for a /video command
          
          var player = self.players[args.roomJid];
          
          var msgPieces = msg.split(" ");
          // handle the different available video commands.
          switch(msgPieces[1]) {
            case "start":
              console.log("start video");
              player.playVideo();
              break;
            case "stop":
              console.log("stop video");
              player.pauseVideo();
              break;
            case "sync":
              console.log("sync video");
              break;
            case "catchup":
              console.log("catchup video");
              break;
            case "id":
              console.log("set video id: " + msgPieces[2]);
              player.loadVideoById(msgPieces[2]);
              break;
            default: 
              console.log("invalid video command: " + msg);
          }
          // if we find /video, ignore the message for sure
          return "";
        }
      }
	  }
	  
    return args.message
	}
	
	var handleAdminMessage = function(args) {
	  // args is {subject, message} (?)
    // I have no idea when this is triggered. I'd like to use it, but
    // it doesn't seem to be chat messages from moderator role users. my
    // hunch is that it's something to do with a special class of message
    // from the server (like SERVER IS GOING DOWN or whatever) but I don't
    // know how to trigger those with my XMPP client.
	  console.log("admin message: " + args.message + " (" + args.subject + ")");
	};
	
	return self;
}(CandyShop.VideoEmbed || {}, Candy, jQuery));