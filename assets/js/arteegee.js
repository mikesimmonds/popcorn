/*
How will this work.
Initial game is just 2 players.
- P1 clicks a green button
- P2 recieves data and his button becomes red;
- P2 clicks red button;
- P1 recieves data and his button becomes red;
after 5 goes the game ends

if you click AND it it your turn, send data [next: P2, count 1]

 */

(function() {

	if(!util.supports.data) {
		$('.no-support').show().next().hide()
		return
	}

	var playerId = null;

	var peer = null; // this is the pre-connection stage
	var peerId = null; // peerId is returned when a connection is initially 'open'
	var conn = null; // this is the connection
	var opponent = {
		peerId: null // the id of the game.
	};
	var turn = false;
	var ended = false;
	var buttonEl = $('#button');

	var lastRecievedTimestamp = null;
	var timeAllowed = 3000;

	function begin() {

		$('#button').on('click', function(event) {
			event.preventDefault();
			if (!turn) {
				return
			}
			if(lastRecievedTimestamp && Date.now() > lastRecievedTimestamp + timeAllowed) {
				console.log('YOU LOSE!');
				conn.send({next: 'bob', timestamp: Date.now(), ended: true});
				$('#game').hide().siblings('section').show()
			}
			conn.send({next: 'bob', timestamp: Date.now(), ended: ended});
			buttonEl.removeClass('green');
			turn = false;
		});

		conn.on('data', function(data) {
			console.log(data);
			if (data.ended) {
				console.log('YOU WON!!!!');
				endTheGame();
			}
			if (turn) {
				return
			}
			if (data['next']) {
				buttonEl.addClass('green');
				lastRecievedTimestamp = data['timestamp'];
				turn = true;
			}
		});

		conn.on('close', function() {
			if(!ended) {
				$('#game .alert p').text('Opponent forfeited!')
			}
			turn = false
		});
		peer.on('error', function(err) {
			alert(''+err)
			turn = false
		})
	}

	function initialize() {
		// peer = new Peer('', {
		// 	host: location.hostname,
		// 	port: location.port || (location.protocol === 'https:' ? 443 : 80),
		// 	path: '/peerjs',
		// 	debug: 3
		// });

		peer = new Peer({
			key: 'lwjd5qra8257b9',  // get a free key at http://peerjs.com/peerserver
			debug: 3,
      secure: true,
			host: '0.peerjs.com',
			post: 80,
			config: {
				'iceServers': [
					{url: 'stun:stun.l.google.com:19302'},
					{url: 'stun:stun1.l.google.com:19302'},
				]
			}
		});



		peer.on('open', function(id) {
			peerId = id
		});
		peer.on('error', function(err) {
			alert(''+err)
		});

		// Heroku HTTP routing timeout rule (https://devcenter.heroku.com/articles/websockets#timeouts) workaround
		function ping() {
			// console.log(peer)
			peer.socket.send({
				type: 'ping'
			})
			setTimeout(ping, 16000)
		}
		ping()
	}

	function endTheGame() {
		conn.close();
		$('#game').hide().siblings('section').show()
	}

	function start() {
		initialize()
		peer.on('open', function() {
			$('#game .alert p').text('Waiting for opponent').append($('<span class="pull-right"></span>').text('Peer ID: '+peerId))
			$('#game').show().siblings('section').hide()
			alert('Ask your friend to join using your peer ID: '+peerId)
		})
		peer.on('connection', function(c) {
			if(conn) { // if theres already a connection don't open another
				c.close();
				return
			}
			conn = c;
			turn = true;
			buttonEl.addClass('green');
			$('#game .alert p').text('Click the button to start')
			begin()
		})
	}

	function join() {
		initialize();
		peer.on('open', function() {
			var destId = prompt("Opponent's peer ID:")
			conn = peer.connect(destId, {
				reliable: true
			});
			conn.on('open', function() {
				opponent.peerId = destId
				$('#game .alert p').text("Waiting for opponent's move")
				$('#game').show().siblings('section').hide()
				turn = false;
				begin()
			})
		})
	}

	$('a[href="#start"]').on('click', function(event) {
		event.preventDefault();
		start()
	});
	$('a[href="#join"]').on('click', function(event) {
		event.preventDefault();
		join()
	});


})();
