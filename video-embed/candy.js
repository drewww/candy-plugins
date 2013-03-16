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
    Candy.View.Event.Room.onAdd = handleRoomAdd;
    
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
    self.player;
    self.playerReady = false;
    
    self.dimensions = {
	    "small":{width:284, height:160},
	    "medium":{width:400, height:225},
	    "large":{width:533, height:300},
	  };
	  
    return self;
	};
	
	var handleRoomAdd = function(args) {
	  // when a room is added, try just destroying all the player infrastructure
	  // and starting over.
	  
	  // we don't want to clear the video for private messages, just for
	  // actual room adds. private messages have /fromNick at the end of
	  // their roomJid.
	  if(args.roomJid.indexOf("/")!=-1) {
	    Candy.Core.log("[video-embed] ignored a room add that was a PM");
	    return;
	  }
	  
	  if(self.player!==undefined) {
      self.player = undefined;
      self.playerReady = false;
      Candy.Core.log("[video-embed] clear video on room change");
      $(".video-embed").remove();
	  }
	}
	
	var handleSubjectChange = function(args) {
	  // args is {roomJid, element, subject}
    var subjectPieces = args.subject.split(" ");
    
    Candy.Core.log("[video-embed] subject: " + args.subject);
    
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
 	    if(self.player!==undefined) {
	    var player = self.player;
      
      // TODO we might want to check that the player is loaded before doing
      // this. if it's not loaded, queue the loadVideo command on
      // the onReady event firing (see below event handler)
      
      if(!self.playerReady) {
        self.onReadyActions.push(function() {
          player.loadVideoById(videoId);
          player.pauseVideo();
        });
      } else {
        player.loadVideoById(videoId);
      }
	  } else {
	    // TODO see what happens when we turn rooms on
	    
      $("#chat-rooms").prepend($('<div class="video-embed"><h1>Current Room Video</h1><div class="close"><img src="candy-plugins/video-embed/img/bullet_arrow_up.png"></div><div class="open"><img src="candy-plugins/video-embed/img/bullet_arrow_down.png"></div><div class="size selected" id="large">L</div><div class="size" id="medium">M</div><div class="size" id="small">S</div><div id="player"></div><br class="clear"></div>'));
      
      $(".video-embed .open").hide();
      
      // check to see if youtube api is available?
      if(!self.youtubeApiAvailable) {
        Candy.Core.log("[video-embed] YouTube API failed to load in time. Cannot embed videos.");
        // TODO we should wait a little and try again. But really, this can
        // only happen if the user manages to log in and start getting data
        // before we manage to asynchronously load the YT lib. Bit of a 
        // reach.
      }
      
      self.playerReady = false;
      self.videoActions = [[],[],[],[],[],[],[]];
      self.onReadyActions = [];
      // now use the youtube api to embed the video
      self.player = new YT.Player('player', {
        height: self.dimensions['large'].height,
        width: self.dimensions['large'].width,
        videoId: videoId,
        startSeconds:0,
        // leaving this here for later.
        // turning this on means users can't scrub or change volume, but can
        // still start/stop by clicking on the video. that's a sort of in-
        // between state. Need to pair controls: 0 with a more elaborate
        // UI redesign that exposes volume and blocks play-pause, or has some
        // way of swapping in and out of controls:0 for users that want to
        // desynchronize.
        // playerVars: {
        //             controls: '0'
        //           },
        events: {
          "onReady": function(args) {
            Candy.Core.log(roomJid + " video ready");
            self.playerReady = true;
            
            for(var i=0; i<self.onReadyActions.length; i++) {
              var action = self.onReadyActions[i];
              
              action.call();
            }
            self.onReadyActions = [];
            },
          "onStateChange": function(args) {
            // this dance is important because certain commands depend on
            // the player being in the right state. For instance,
            // you can't just run a playVideo command immediately
            // followed by seekTo; the seekTo is ignored because
            // the video hasn't started yet. So we can queue up
            // multiple commands in a row this way.
            var state = args.data;
            
            if(state==-1) {
              state=6;
            }
            
            for(var i=0; i<self.videoActions[state].length; i++) {
              var action = self.videoActions[state][i];
              Candy.Core.log("[video-embed] handling action on state change to state " + state);
              action.call();
            }
            self.videoActions[state] = [];
          },
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

	  // returning an empty string causes the message to get tossed out
	  // this is perfect!
    // return "";
    
    // extract the user object, given the nick we have
    var user;
    if(args.roomJid in Candy.Core.getRooms()) {
	    user = Candy.Core.getRooms()[args.roomJid].roster.get(args.roomJid + "/" + args.nick);
	  }
	  
    if(args.roomJid.indexOf("/")!=-1) {
      Candy.Core.log("[video-embed] ignoring a private message");
      return args.message;
    }
	  
	  if(user!==undefined) {
	    // okay, given the user object exists, check and see if they're a 
	    // moderator.
      if(user.getRole()==user.ROLE_MODERATOR) {
        // TODO is there any way to check if this message is a past
        // message that got sent on login versus a live message?
        
        // if it's a moderator user, inspect the message to see if we need
        // to respond.
        var msg = args.message;
        
        if(msg.indexOf("/video")==0) {
          // look for a /video command
          
          var player = self.player;
          var msgPieces = msg.split(" ");
          
          if(!self.playerReady) {
            // this trap has the effect of also ignoring commands
            // from the before-you-joined stanzas, because those
            // are processed before the topic message which always arrives
            // last.
            Candy.Core.log("[video-embed] received command for video player that isn't ready");
            return;
          }
          
          Candy.Core.log("[video-embed] video state: " + player.getPlayerState());
          
          // handle the different available video commands.
          switch(msgPieces[1]) {
            case "start":
              Candy.Core.log("[video-embed] start video");
              player.playVideo();
              break;
            case "stop":
              Candy.Core.log("[video-embed] stop video");
              player.pauseVideo();
              break;
            case "clear":
              player = null;
              self.player = null;
              Candy.Core.log("[video-embed] clear video");
              $(".video-embed").remove();
              break;
            case "time":
              // time sets all clients connected to this time, regardless
              // of what they're doing now.
            
              var timeInSeconds = getSecondsFromTime(msgPieces[2]);

              // validate that it's not beyond the end of the video
              // if the player hasn't loaded the video yet, getDuration()
              // returns 0. In that case, we can't really do a valid check
              // here, so accept anything.
              if(player.getDuration()!=0 && timeInSeconds > player.getDuration()) {
                return "";
              }
              
              var start = true;
              if(msgPieces.length==4 && msgPieces[3]=="stop") {
                // then we should start in a paused mode
                start = false;
              }
              
              setPlayerTime(msgPieces[2], start);
              
              break;
            case "catchup":
              // catchup is like time, but it's designed to onboard late
              // entrants to an event. it won't mess with playback if
              // the video is already playing, but it will bring people up
              // to speed if they're stopped or far away from the target time
              
              var start = true;
              if(msgPieces.length==4 && msgPieces[3]=="stop") {
                // then we should start in a paused mode
                start = false;
              }
              
              var player = self.player;
              var timeInSeconds = getSecondsFromTime(msgPieces[2]);
          	  
              // if the player is queued or unloaded, we can't check time and
              // will call setPlayerTime for sure. If the player is loaded
              // or started or paused, check and see if we should update.
              if(player.getPlayerState()!=5 && player.getPlayerState()!=-1){
                if(Math.abs(player.getCurrentTime() - timeInSeconds) < 5) {
                  Candy.Core.log("[video-embed] ignoring a catchup command but we're close enough");
                  return "";
                }
              }
              Candy.Core.log("[video-embed] catchup video");
              
              setPlayerTime(msgPieces[2], start);
              
              break;
            case "done":
              // annoying, calling player.stopVideo() can put the player
              // in whatever state it feels like other than 1. But it seems
              // to do -1 reliably.
              player.stopVideo();
              Candy.Core.log("[video-embed] synchronized playback over");
              break;
            default: 
              Candy.Core.log("[video-embed] invalid video command: " + msg);
              break;
          }
          // if we find /video, ignore the message for sure
          return "";
        }
      }
	  }
	  
    return args.message
	};
	
	var setPlayerTime = function(timeString, start) {
	  var timeInSeconds = getSecondsFromTime(timeString);
    var player = self.player;
    var curPlayerState = player.getPlayerState();
    
    // seek target in seconds
    // if player is running already, seek.
    // if it's stopped, start, wait until it has actually started
    // and then seek.
    if(player.getPlayerState()!=5 && player.getPlayerState()!=-1) {
      if(!start) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
      
      player.seekTo(timeInSeconds);
    } else {
      player.playVideo();
      queueVideoAction(function() {
        if(!start) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
        
        player.seekTo(timeInSeconds);
      }, 1);
    }
    
    Candy.Core.log("[video-embed] setPlayerTime: " + timeInSeconds + " ("+(start?"started":"stopped")+")");
	};
	
	var queueVideoAction = function(action, onState) {
	  if(onState==-1) {
	    onState = 6;
	  }
	  
	  if(onState<0 || onState >6) {
	    Candy.Core.log("[video-embed] Bad call to queueVideoAction, invalid state: " + onState);
	    return;
	  }
	  
	  self.videoActions[onState].push(action);
	}
	
	var handleAdminMessage = function(args) {
	  // args is {subject, message} (?)
    // I have no idea when this is triggered. I'd like to use it, but
    // it doesn't seem to be chat messages from moderator role users. my
    // hunch is that it's something to do with a special class of message
    // from the server (like SERVER IS GOING DOWN or whatever) but I don't
    // know how to trigger those with my XMPP client.
	  Candy.Core.log("[video-embed] admin message: " + args.message + " (" + args.subject + ")");
	};
	
	// accepts times in the forms:
	// h:mm:ss
	// mm:ss
	// ss
	var getSecondsFromTime = function(timeStr) {
    var timePieces = timeStr.split(":");
    
    var seconds = 0;
    
    var counter = 0;
    for(var i=timePieces.length-1; i>=0; i--) {
      var field = parseInt(timePieces[i]);
      switch(counter) {
        case 0:
          seconds += field;
          break;
        case 1:
          seconds += 60*field;
          break;
        case 2:
          seconds += 60*60*field;
          break;
      }
      counter++;
    }
    
    return seconds;
	};
	
	return self;
}(CandyShop.VideoEmbed || {}, Candy, jQuery));