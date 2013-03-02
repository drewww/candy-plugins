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
	  console.log("VideoEmbed hello world!");
	};
	
	return self;
}(CandyShop.VideoEmbed || {}, Candy, jQuery));