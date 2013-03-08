var CandyShop = (function(self) {return self;}(CandyShop || {}));

/**
 * Class: Shows a list of rooms upon connection and adds a little icon to bring list of rooms
 */
CandyShop.RoomPanel = (function(self, Candy, Strophe, $) {
    var _options = {
         // domain that hosts the muc rooms, only required if autoDetectRooms is enabled
        mucDomain: '',

        // allow you to force a list of rooms, only required if autoDetectRoom is disabled
        roomList: [],

        // show room list if all rooms are closed, default value is true. [optional]
        showIfAllTabClosed: true,

        // detect rooms before showing list, default value is true. [optional]
        autoDetectRooms: true,

        // how long in seconds before refreshing room list, default value is 600. [optional]
        roomCacheTime: 600,
        
        // whether joining a new room exists your existing room. ie,
        // are users allowed to be in more than one room or not.
        limitOneRoom: false
    };
    
    var _lastRoomUpdate = 0;
    self.init = function(options) {
        
        $.extend(_options, options);
        self.applyTranslations();
        
        
        /* Overwrite candy allTabsClosed function not
         *  to disconnect when all tags are closed */
        if (_options.showIfAllTabClosed) {
            Candy.View.Pane.Chat.allTabsClosed = function () {
                CandyShop.RoomPanel.showRoomPanel();
                return;
            };
        } //if


        // replace the button in the bottm right hand bar with
        // a much more prominent button that goes into the top
        // gutter where the room tabs actually go. 
        var html = '<div id="roomPanel-button" data-tooltip="' + $.i18n._('candyshopRoomPanelListRoom') + '">change room</div>';
        $("#chat-pane").prepend(html);
        $('#roomPanel-button').click(function() {
            CandyShop.RoomPanel.showRoomPanel();
        });
        
        // since we're appending to chat-pane, which is shown at start
        // behind the login screen, need to hide the button for now.
        $("#roomPanel-button").hide();

        Candy.Core.Event.addObserver(Candy.Core.Event.KEYS.CHAT, {update: function(obj, data) {
            if (data.type == 'connection') {
                if (Strophe.Status.CONNECTED == data.status) {
                    /* only show room window if not already in a room, timeout is to let some time for auto join to execute */
                    setTimeout(CandyShop.RoomPanel.showRoomPanelIfAllClosed, 500);
                    // now show the button
                    $("#roomPanel-button").show();
                } //if
            } //if
            return true;
        }});
    
    };

    self.showRoomPanelIfAllClosed = function() {
        
        var roomCount = 0;
        var rooms = Candy.Core.getRooms();
        for (k in rooms) {
            if (rooms.hasOwnProperty(k)) {
                roomCount++;
            } //if
        } //for

        if (roomCount == 0) {
            CandyShop.RoomPanel.showRoomPanel();
        } //if
    }
    
    self.updateRoomList = function (iq) {
        
        var newRoomList = [];
        $('item', iq).each(function (index, value) {
            var name = $(value).attr('name');
            var jid = $(value).attr('jid');
            
            if (typeof name == 'undefined') {
                name = jid.split('@')[0];
            } //if
            
            newRoomList.push({
                name: name,
                jid: jid
            });
        });

        _options.roomList = newRoomList;
        _lastRoomUpdate = Math.round(new Date().getTime() / 1000);
        
        self.showRoomPanel();
    };

    self.showRoomPanel = function() {

            /* call until connecting modal is gone */
            if ($('#chat-modal').is(':visible')) {
                setTimeout(CandyShop.RoomPanel.showRoomPanel, 100);
            } else {
                var timeDiff = Math.round(new Date().getTime() / 1000) - _options.roomCacheTime;
                if (_options.autoDetectRooms && timeDiff > _lastRoomUpdate ) {
                    /* sends a request to get list of rooms user for the room */
                    var iq = $iq({type: 'get', from: Candy.Core.getUser().getJid(), to: _options.mucDomain  , id: 'findRooms1'})
                        .c('query', {xmlns: Strophe.NS.DISCO_ITEMS});
                    
                    Candy.Core.getConnection().sendIQ(iq, self.updateRoomList);
                } else {

                    var html = Mustache.to_html(CandyShop.RoomPanel.Template.rooms, {
                            title: $.i18n._('candyshopRoomPanelChooseRoom'),
                            roomList: _options.roomList
                    });
                    Candy.View.Pane.Chat.Modal.show(html,true);

                    $('.roomList a').bind('click', function(e) {
                        // first, leave the room we're in. this is a deviation
                        // from the traditional model. we're forcing ppl to
                        // be in one room at a time for the first experiment.
                        var currentRoomJids = Object.keys(
                          Candy.Core.getRooms());
                        
                        var newRoomJid = this.href.split('#')[1];
                        Candy.Core.Action.Jabber.Room.Join(newRoomJid);
                        Candy.View.Pane.Chat.Modal.hide();
                        e.preventDefault();
                        
                        
                        if(_options.limitOneRoom) {
                          // we're expecting one room here, but loop it.
                          // we do this after we join because if we're ever in
                          // no rooms, that can trigger the join dialog. so
                          // we get the room list before we join, then drop
                          // all the ones that were there before the new one.
                          for(var i=0; i<currentRoomJids.length; i++) {
                            Candy.Core.Action.Jabber.Room.Leave(
                              currentRoomJids[i]);
                          }
                        }
                    });
                    
                } //if
                
            } //if

            return true;
    };

    self.applyTranslations = function() {
            Candy.View.Translation.en.candyshopRoomPanelListRoom = 'List Rooms';
            // Candy.View.Translation.ru.candyshopRoomPanelListRoom = 'Список комнат';
            Candy.View.Translation.de.candyshopRoomPanelListRoom = 'Verfügbare Räume anzeigen';
            Candy.View.Translation.fr.candyshopRoomPanelListRoom = 'Liste des salles';
            Candy.View.Translation.nl.candyshopRoomPanelListRoom = 'List Rooms';
            Candy.View.Translation.es.candyshopRoomPanelListRoom = 'List Rooms';
            
            
            Candy.View.Translation.en.candyshopRoomPanelChooseRoom = 'Choose Room To Join';
            // Candy.View.Translation.ru.candyshopRoomPanelChooseRoom = 'Выберите комнату ';
            Candy.View.Translation.de.candyshopRoomPanelChooseRoom = 'Verfügbare Räume';
            Candy.View.Translation.fr.candyshopRoomPanelChooseRoom = 'Choisir une salle';
            Candy.View.Translation.nl.candyshopRoomPanelChooseRoom = 'Choose Room To Join';
            Candy.View.Translation.es.candyshopRoomPanelChooseRoom = 'Choose Room To Join'; 
            
    };

    return self;
}(CandyShop.RoomPanel || {}, Candy, Strophe, jQuery));

CandyShop.RoomPanel.Template = (function (self) {
    var roomParts = [
        '<div class="roomList">',
            '<h2>{{title}}</h2>',
            '<ul>',
                '{{#roomList}}',
                    '<li><a href="#{{jid}}">{{name}}</a></li>',
                '{{/roomList}}',
            '</ul>',
        '</div>'
    ];
    
    self.rooms = roomParts.join('');
    
    return self;
})(CandyShop.RoomPanel.Template || {});