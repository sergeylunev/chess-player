// TODO:
// DONE 1. Reseting position and restart play
// DONE 2. Stoping play
// DONE 3. Continue play after stop
// 4. Multiple boards
// 5. Board customisation
// 6. Getting data from other sources
// 7. If on reseting we have stoped game, dont start it after reseted
function ChessPlayer() {
    this.interval = null;
    this.started = false;
    this.paused = false;
    this.moves = [];
    this.currentMove = 0;
    this.init = function(boardId) {
        this.board = ChessBoard(boardId, 'start');
        this.game = new Chess();

        return this;
    };
    this.trim = function(str) {
        return str.replace(/^\s+|\s+$/g, '');
    };
    this.header = {};
    this.set_header = function(args) {
        for (var i = 0; i < args.length; i += 2) {
          if (typeof args[i] === 'string' &&
              typeof args[i + 1] === 'string') {
            this.header[args[i]] = args[i + 1];
          }
        }
        return this.header;
    };
    this.read = function(pgn) {
        var t = this;

        function mask(str) {
            return str.replace(/\\/g, '\\');
        }

      function has_keys(object) {
        for (var key in object) {
          return true;
        }
        return false;
      }

      function parse_pgn_header(header, options) {
        var newline_char = (typeof options === 'object' &&
                            typeof options.newline_char === 'string') ?
                            options.newline_char : '\r?\n';
        var header_obj = {};
        var headers = header.split(new RegExp(mask(newline_char)));
        var key = '';
        var value = '';

        for (var i = 0; i < headers.length; i++) {
          key = headers[i].replace(/^\[([A-Z][A-Za-z]*)\s.*\]$/, '$1');
          value = headers[i].replace(/^\[[A-Za-z]+\s"(.*)"\]$/, '$1');
          if (t.trim(key).length > 0) {
            header_obj[key] = value;
          }
        }

        return header_obj;
      }

      var newline_char = (typeof options === 'object' &&
                          typeof options.newline_char === 'string') ?
                          options.newline_char : '\r?\n';
      var regex = new RegExp('^(\\[(.|' + mask(newline_char) + ')*\\])' +
                             '(' + mask(newline_char) + ')*' +
                             '1.(' + mask(newline_char) + '|.)*$', 'g');

      /* get header part of the PGN file */
      var header_string = pgn.replace(regex, '$1');

      /* no info part given, begins with moves */
      if (header_string[0] !== '[') {
        header_string = '';
      }

      /* parse PGN header */
      var headers = parse_pgn_header(header_string);
      for (var key in headers) {
        t.set_header([key, headers[key]]);
      }

      /* load the starting position indicated by [Setup '1'] and
      * [FEN position] */
      if (headers['SetUp'] === '1') {
          if (!(('FEN' in headers) && load(headers['FEN']))) {
            return false;
          }
      }

      /* delete header to get the moves */
      var ms = pgn.replace(header_string, '').replace(new RegExp(mask(newline_char), 'g'), ' ');

      /* delete comments */
      ms = ms.replace(/(\{[^}]+\})+?/g, '');

      /* delete recursive annotation variations */
      var rav_regex = /(\([^\(\)]+\))+?/g
      while (rav_regex.test(ms)) {
        ms = ms.replace(rav_regex, '');
      }

      /* delete move numbers */
      ms = ms.replace(/\d+\.(\.\.)?/g, '');

      /* delete ... indicating black to move */
      ms = ms.replace(/\.\.\./g, '');

      /* delete numeric annotation glyphs */
      ms = ms.replace(/\$\d+/g, '');

      /* trim and get array of moves */
      var moves = t.trim(ms).split(new RegExp(/\s+/));

      /* delete empty entries */
      moves = moves.join(',').replace(/,,+/g, ',').split(',');

        return moves;
    };
    this.play = function(pgn) {
        var that = this;

        console.log(pgn);

        if (that.started && that.paused) {
            that.paused = false;
        }

        if (!that.started) {
            that.moves = that.read(pgn);

            that.interval = setInterval(function() {
                if(that.paused) return;

                that.game.move(that.moves[that.currentMove]);
                that.board.position(that.game.fen());
                that.currentMove = that.currentMove + 1;
            }, 500);
            that.started = true;
        }
    };
    this.stop = function() {
        var that = this;

        if (this.started) {
            that.paused = true;
        }
    };
    this.reset = function() {
        var that = this;

        if (that.started) {
            // First of all pause game
            that.paused = true;

            that.currentMove = 0;
            that.game.reset();
            that.board.start(false);

            that.paused = false;
        }
    };
};

(function($){
    $('.board').each(function(){
        var boardId = this.id
        var player = new ChessPlayer();
        player.init(boardId);
        
        var moves = $('#' + this.getAttribute('data-moves')).val();

        $('#'+boardId+'_start').on('click', function(){
            player.play(moves);
        });

        $('#'+boardId+'_stop').on('click', function(){
            player.stop();
        });

        $('#'+boardId+'_reset').on('click', function(){
            player.reset();
        });
    });
})(jQuery);
