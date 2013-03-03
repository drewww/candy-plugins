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
    Candy.View.Event.Chat.onADminMessage = handleAdminMessage;
    
    return self;
	};
	
	var handleSubjectChange = function(args) {
	  // args is {roomJid, element, subject}
    console.log("subject change: " + args.subject);
    
    var subjectPieces = args.subject.split(" ");
    
    // now loop through the pieces looking for video.
    var foundVideo = false;
    for(var i=0; i<subjectPieces.length; i++) {
      var piece = subjectPieces[i];
      
      if(piece.toLowerCase().indexOf("video")!=-1) {
        // if we find it, look at the next piece for the url.
        var videoUrl = subjectPieces[i+1];
        
        var videoId = extractYoutubeId(videoUrl);
        
        if(!videoId) {
          continue;
        } else {
          foundVideo = true;
          createOrUpdateEmbed(videoId);
        }
      }
    }
    
    console.log("found video? " + foundVideo);
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
      console.log("Bad youtube url: " + youtubeURL)
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
	
	var createOrUpdateEmbed = function(videoId) {
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
	    
      $("#chat-rooms").prepend($('<div class="video-embed"><h1>Current Room Video</h1><div class="close"><img src="candy-plugins/video-embed/img/bullet_arrow_up.png"></div><div class="open"><img src="candy-plugins/video-embed/img/bullet_arrow_down.png"></div><br class="clear"><iframe width="533" height="300" src="http://www.youtube.com/embed/'+videoId+'?rel=0" frameborder="0" allowfullscreen></iframe></div>'));
      
      $(".video-embed .close").click(function() {
        hideEmbed();
      });
      
      $(".video-embed .open").click(function() {
        showEmbed();
      });
      
	  }
	  
	};
	
	var handleAdminMessage = function(args) {
	  // args is {subject, message} (?)
    
	  console.log("admin message: " + args.message + " (" + args.subject + ")");
	};
	
	return self;
}(CandyShop.VideoEmbed || {}, Candy, jQuery));