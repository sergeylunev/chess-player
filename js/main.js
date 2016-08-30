// TODO:
// 1. Reseting position and restart play
// 2. Stoping play
// 3. Continue play after stop
ChessPlayer = {
    init: function(boardId) {
        this.board = ChessBoard(boardId, 'start');
        this.game = new Chess();

        return this;
    },
    trim: function(str) {
        return str.replace(/^\s+|\s+$/g, '');
    },
    header: {},
    set_header: function(args) {
        for (var i = 0; i < args.length; i += 2) {
          if (typeof args[i] === 'string' &&
              typeof args[i + 1] === 'string') {
            this.header[args[i]] = args[i + 1];
          }
        }
        return this.header;
    },
    read: function(textareaId) {
        var pgn = $(textareaId).val();
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
    },
    play: function(textareaId) {
        var moves = this.read(textareaId);
        var index = 0;
        var that = this;

        setInterval(function() {
            that.game.move(moves[index]);
            that.board.position(that.game.fen());

            index = index + 1;
        }, 500);
    }
};

(function($){
    var player = ChessPlayer.init('board');

    $('#submit').on('click', function(){
        player.play('#moves');
    });
})(jQuery);
