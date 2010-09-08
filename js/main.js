
var ARIMAA_MAIN = ARIMAA_MAIN || function() {
	var domtree;
	var gametree;
	var viewer;
	var current_gametree_id = undefined;
	var current_move_index = 0;
	var current_domtree_node = undefined;
	
	var stepbuffer = [];
	
	var showing_slowly = false; // when moves are showed slowly, controls are locked
	
	//FIXME: should be probably removed since they are in gametree
	var board = init_arimaa_board()['board'];
	var gamestate = ARIMAA.get_initial_gamestate();
	
	var selected = undefined; // what square is selected currently

	function get_current_node() { return gametree.select_node(current_gametree_id); }
	
	//FIXME: piece testing should be in arimaa logic
	function is_piece(piece) { return piece !== undefined && piece['type'] !== undefined; }
	
	function get_pic(piece, side) {
		return piece.type + ".png";
	}
	
	function sideprefix(piece) {
		return piece.side === ARIMAA.gold ? 'g' : piece.side === ARIMAA.silver ? 's' : '';
	}
	
	function create_square(piece) {
		if(is_piece(piece)) {
			return '<div class="square"><img src="pics/' + sideprefix(piece) + get_pic(piece) + '" /></div>';
		} else return '<div class="square"></div>';
	}
	 
	function create_dom_board(board) {
		var result = "";
		for(var i = 0; i < board.length; ++i) {
			var mapped_row = GENERIC.map(board[i], create_square);
			var row = GENERIC.reduce("", mapped_row, function(s1, s2) { return s1 + s2; });
			result += "<div class='row'>" + row + "</div>";
			result += "<div class='clear'></div>";
		}
		
		return result;
	}
	
	function opposite_turn(turn) { return turn === ARIMAA.gold ? ARIMAA.silver : ARIMAA.gold }
	function singleton_after_opposite(turn) {
		return opposite_turn(turn).side.slice(0, 1) + "singleton_after";
	}
	function singleton_before_opposite(turn) {
		return opposite_turn(turn).side.slice(0, 1) + "singleton_before";
	}
	
	function make_step_to_gametree(step) {
		// step = { 'from': selected, 'to': new_coordinate, 'piece': piece }
		stepbuffer.push(step);
	}	

	// where there's no move for current nodehandle, it's a "direct continuation" 
	function make_continuation_to_variation(current_nodehandle) {
		console.log("continuation");
		var variation_name = "-";
		
		var move = {
			'id': variation_name, 
			'steps': stepbuffer
		}
		
		var result = gametree.make_move(move, current_nodehandle);
		var nodehandle = result.nodehandle;
		var move_index = result.move_index;

		var id = nodehandle.id + "_0";
		
		// id and name for treenode
		var js = {
			'attr': {'id': id },
			'data': variation_name.toString()
		}

		// if first move in this line of play, put it as a sibling, otherwise it's a variation (of maybe a variation)
		//var where_to = "#" + current_gametree_id;
		var where_to = domtree.jstree('get_selected');
		
		
		var nodetype = nodehandle.gamestate.turn.side.slice(0, 1) + 'singleton_after';
		
		// create variation
		domtree.jstree("create", where_to, "after", js, false, true);
		domtree.jstree('set_type', nodetype, '#' + id);
			
		// if node that precedes was a singleton, it must be changed to normal
		var nodetype_preceding = 
			current_nodehandle.previous_nodehandle.gamestate.turn.side.slice(0, 1) + 'move_before';		
		domtree.jstree('set_type', nodetype_preceding, where_to);
		 
	}
	
	function make_move_to_gametree() {
		var current_nodehandle = gametree.select_node(current_gametree_id);

		// node where there's no moves yet
		if(current_nodehandle.moves_from_node.length === 0) {
			make_continuation_to_variation(current_nodehandle);
			return;
		}
		
		console.log("variation");
		
		// FIXME: something smarter for the name 
		var variation_name = (function(){
			if(current_nodehandle.moves_from_node.length > 0) {
				return current_nodehandle.moves_from_node[0].id + "&nbsp;<strong>[" + current_nodehandle.moves_from_node.length + "]</strong>";
			} else return current_nodehandle.id;
		})();

		var move = {
			'id': variation_name, 
			'steps': stepbuffer
		}
		
		stepbuffer = [];
		
		var result = gametree.make_move(move, current_nodehandle);
		var nodehandle = result.nodehandle;
		var move_index = result.move_index;

		var id = current_nodehandle.id + "_" + move_index;
		
		// id and name for treenode
		var js = {
			'attr': {'id': id, 'move_index': move_index.toString() },
			'data': variation_name.toString()
		}

		var id2 = nodehandle.id + "_0"; // no moves there yet

		var js2 = {
			'attr': {'id': id2 },
			'data': "-"
		}
		
		// if first move in this line of play, put it as a sibling, otherwise it's a variation (of maybe a variation)
		var node_position_in_tree = current_nodehandle.moves_from_node.length === 1 ? "last" : "inside";
		
		//var where_to = "#" + current_gametree_id;
		var where_to = domtree.jstree('get_selected');

		// this must be before creating the node, since deselecting trigger event that changes the singletontype
		//domtree.jstree('deselect_all');
		
		// create variation
		domtree.jstree("create", where_to, node_position_in_tree, js, false, true);
		var nodetype = nodehandle.gamestate.turn.side.slice(0, 1) + 'singleton_after';
		domtree.jstree('set_type', nodetype, '#' + id);
		
		current_domtree_node = $('#' + id);
		var treenodeid = '#' + id;
  	//domtree.jstree('select_node', treenodeid);

		//refresh_domtree();
		update_selected_nodehandle_view();

		// create after variation
		//$('.gametree').jstree("create", "#" + id /* after just created node */, "after", js2, false, true);
	}

	function show_turn() {
		if(gamestate.turn === ARIMAA.gold) {
			$('.turn')
				.text("Gold to move")
				.css('color', "yellow");			
		} else {
			$('.turn')
				.text("Silver to move")
				.css('color', "#ccc");
		}
	}
	
	function show_current_position_info() {
		show_comments(); //FIXME not the best place
		show_turn();
	}
	
	function show_board(board) {
		show_current_position_info(); //FIXME not the best place
		
  	var dom_board = create_dom_board(board);
  	$('.board').html(dom_board);
  	GENERIC.for_each(ARIMAA.traps, function(trap) {
  			$('.row').eq(trap[0]).find('.square').eq(trap[1]).addClass('trap');
  	});
	}
	
	function bind_select_piece() {
		$('.square').live('click', function() {
			$(this).toggleClass('selected');
		});
	}

	function bind_select_piece() {
		$('.square').live('mouseover', function() {
			selected = coordinate_for_element($(this));
			show_arrows($(this));
		});
	}

	function coordinate_for_element(elem) {
		return {
			'row': row_index(elem),
			'col': col_index(elem)
		}		
	}
	
	function coordinates_from_arrow(arrow) {
		return {
			'row': parseInt(arrow.attr('row')),
			'col': parseInt(arrow.attr('col'))
		}
	}
	
	function bind_move_piece() {
		$('.arrow').click(function() {
			var new_coordinate = coordinates_from_arrow($(this));
			make_step_for_piece(selected, new_coordinate);
		});
	}
	
	// this is for making a new move
	function make_step_for_piece(selected, new_coordinate) {
		if(selected === undefined) return;

		var piece = board[selected.row][selected.col];
		var step = { 'from': selected, 'to': new_coordinate, 'piece': piece } 
		//FIXME: making move to gametree should be behind common interface with getting new board
		result = ARIMAA.move_piece(gamestate, board, selected, new_coordinate);
		
		make_step_to_gametree(step);
		// if turn changed, commit the steps into gametree as a move
		if(result.gamestate.turn !== gamestate.turn) make_move_to_gametree();
		
		board = result.board;
		gamestate = result.gamestate;
		show_board(board);
		clear_arrows();
	}

	// this is for showing already made moves
	function show_make_step_for_piece(selected, new_coordinate) {
		var piece = board[selected.row][selected.col];
		var move = { 'from': selected, 'to': new_coordinate, 'piece': piece } 
		//FIXME: making move to gametree should be behind common interface with getting new board
		result = ARIMAA.move_piece(gamestate, board, selected, new_coordinate);
		
		board = result.board;
		gamestate = result.gamestate;
		show_board(board);
		clear_arrows();
	}
	
	function clear_arrows() {
		$('.arrow').hide();
	}
	
	function show_arrows(elem) {
		$('.arrow').hide();
		
		var coordinate = {
		 'row': row_index(elem),
		 'col': col_index(elem)
		}
		
		selected = coordinate;
		
		var possible_moves = ARIMAA.legal_moves(gamestate, board, coordinate);

		//console.log(possible_moves);
		
		GENERIC.for_each(possible_moves, function(move) {
				var x_change = move.col - coordinate.col;
				var y_change = move.row - coordinate.row;
				var piece_center = {
					'x': elem.position().left + elem.width() / 2,
					'y': elem.position().top + elem.height() / 2
				}
				show_arrow_for_move(coordinate, piece_center, x_change, y_change);
		});
	}
	
	function get_arrow_elem(x_change, y_change) {
		return x_change < 0 ? "left" : x_change > 0 ? "right" : y_change < 0 ? "up" : "down"; 
	}
	
	function show_arrow_for_move(coordinate, piece_center, x_change, y_change) {
		var center_x = piece_center.x - $('.arrow').width() / 2;
    var center_y = piece_center.y - $('.arrow').height() / 2;

    var arrow_dir = get_arrow_elem(x_change, y_change);
    
    var arrow_elem = $('#arrow' + "_" + arrow_dir);
    
    arrow_elem
      .attr('row', coordinate.row + y_change)
      .attr('col', coordinate.col + x_change)
      .css('left', center_x + (x_change !== 0 ? x_change * arrow_elem.width() * 0.9 : 0))
      .css('top', center_y + (y_change !== 0 ? y_change * arrow_elem.height() * 0.9: 0))
      .show();
	}
		
	function row_index(elem) {
		return parseInt($('.row').index(elem.closest('.row')));
	}
	
	function col_index(elem) {
		var row = elem.closest('.row');
		var elems_in_row = row.find('.square');
		return parseInt(elems_in_row.index(elem));
	}

/*	
	function show_gametree() {
		return;
		var handles = gametree.get_nodehandles();
		
		GENERIC.for_each(handles, function(elem) { $('.gametree').append(create_dom_nodehandle(elem)); });
	}
*/
	
	function show_step(step) {
		if(step.type === 'setting') {
			result = ARIMAA.add_piece(step.piece, step.to, board, gamestate);
			board = result.board;
			gamestate = result.gamestate;
			show_board(board);
		} else if(step.type === 'removal') {
			throw "removal step should not be handled here, the game logic should take care of it";			
			// this can be skipped, since the effect is already done in previous step
			
			//board = ARIMAA.remove_piece(step.coordinate, board);
			//show_board(board);
			
		} else {
			show_make_step_for_piece(step.from, step.to);
		}
	}



	function show_steps_slowly(steps) {
		if(steps.length === 0) {
			var cur_node = gametree.next_nodeid(current_gametree_id, current_move_index);
			gametree_goto(cur_node);
			current_move_index = 0; // FIXME: doesn't prolly work in general
			showing_slowly = false;

      update_selected_nodehandle_view();
			return;
		}

		show_step(steps[0]);
		setTimeout(function() {
				if(showing_slowly) show_steps_slowly(steps.slice(1)); 
			}, 300);				
	}
	
	function show_next_move_slowly() {
		var node = gametree.select_node(current_gametree_id);

		if(node.moves_from_node.length > 0) {
			var move_index = current_move_index;
			var steps = node.moves_from_node[move_index].steps;
			show_steps_slowly(steps);
		}
	}

	function show_next() {
		show_variation(current_move_index);
	}

	function show_variation(move_index) {
		var cur_node = gametree.select_node(current_gametree_id);
		if(move_index >= cur_node.moves_from_node.length) {
			return;
		}
		
		//GENERIC.log(gametree.select_node(current_gametree_id).moves_from_node[move_index]);
		
		var nextid = gametree.next_nodeid(current_gametree_id, move_index);
		current_move_index = 0;
		
		if(!nextid) return;
		
		gametree_goto(nextid);
		show_board(board);
		
		// NOTE! current_gametree_id has been updated by gametree_goto
		var node_now = gametree.select_node(current_gametree_id);
		if(node_now.moves_from_node.length === 0) {
			var treenode_id = "#" + cur_node.id + "_" + move_index;
			
//			domtree.jstree('set_type', singleton_after_opposite(node_now.gamestate.turn), treenode_id);
			var prefix = node_now.gamestate.turn.side.slice(0, 1); 
			domtree.jstree('set_type', prefix + 'singleton_after', treenode_id);
			current_domtree_node = $(treenode_id);
			//refresh_domtree();			

			//domtree.jstree('select_node', treenode_id);
			update_selected_nodehandle_view();
			//current_move_index = move_index;
			//current_gametree_id = 			
		} else {
			current_domtree_node = $('#' + nextid + '_' + current_move_index);
			console.log("urgh");
			update_selected_nodehandle_view();			
		}
	}

	function show_previous() {
		var move_index = current_move_index;
		var previd = gametree.previous_nodeid(current_gametree_id, move_index);
		current_domtree_node = $('#' + previd + '_' + move_index);
		//var previd = gametree.previous_nodeid(current_gametree_id);
		if(!!previd) {
			gametree_goto(previd);
			show_board(board);
			update_selected_nodehandle_view();
		}		
	}

	function getKeyCode(event) {
		return event.keycode || event.which;
	}  
	
	function is_right_arrow_key(code) { return code === 39; }
	
	function bind_control_move() {
		$('.next').click(function() { show_next(); });
		$('.prev').click(function() { show_previous(); });
		
    $(window).keydown(function(event) {
      var code = getKeyCode(event);
      if(is_right_arrow_key(code)) {
      	showing_slowly = false;
      	show_next();
      }
      if(code === 37) {
      	showing_slowly = false;
      	show_previous();
      }

      //console.log(code);
      //if(code === 38) import_game(); // for debugging purposes quick importing
      
      if(code === 40) { // down key
      	if(showing_slowly) return;
				showing_slowly = true;
				show_next_move_slowly();
      }
      
      if(code >= 96 && code <= 105) {
      	show_variation(code - 96);
      }
    });
  }

	function show_comments() {
		var current = get_current_node();
		if(!current) return;
		
  	$('.comments_for_node').val(current.comment);
	}
	
  function update_selected_nodehandle_view() {

  	var nodeid = current_gametree_id + "_" + current_move_index;
//  	var jqueryNode = $('#' + nodeid);
		var jqueryNode = current_domtree_node;

  	if(jqueryNode.length > 0) {
  	  console.log("updating");
  		var last_selected = domtree.jstree('get_selected');
  		domtree.jstree('deselect_node', last_selected);
			//domtree.jstree('deselect_all');
			domtree.jstree('select_node', jqueryNode); //FIXME: should work on variations too, 0 = main game line
			$('.scrollabletree').scrollTo(jqueryNode, {offset: -100});
		} else {
			console.log("node does not exist");
		}
  }

 	function create_dom_nodehandle(nodehandle) {
		//var movename = nodehandle.gamestate.turn.slice(0, 1);
		//FIXME last position should also be shown even though no moves yet
		if(nodehandle.moves_from_node.length > 0) { // if moves for this position
			var movename = nodehandle.moves_from_node[0].id /* show main variant */;
			var side = nodehandle.gamestate.turn.side;									 
			return $('<div class="nodehandle" side="' + side + '" id="' + nodehandle.id + '">' + movename + '</div>');
		}
	}

	function create_tree_and_viewer(domtree) {
  	gametree = create_gametree();
  	viewer = create_viewer(gametree, domtree);
	}
	
  function build_move_tree(moves) {
  	create_tree_and_viewer(domtree);
  	var initial_handle = gametree.get_initial_nodehandle();
  	var nodehandle = initial_handle;
  	
		$('.nodehandle').remove();
		domtree.children().remove();

		//FIXME: can be recursive with variations
  	GENERIC.for_each(moves, function(move) {
			var result = gametree.make_move(move, nodehandle);
			var new_nodehandle = result.nodehandle;
  			
			nodehandle = new_nodehandle;
			//console.log(nodehandle.gamestate.steps);
		});

		GENERIC.for_each(gametree.get_nodehandles(), function(nodehandle) {
			if(nodehandle.moves_from_node.length > 0) {
				var dom_nodehandle = create_tree_nodehandle(nodehandle, 0);
				domtree.append(dom_nodehandle);
				//lastnode = $('#' + dom_nodehandle.find('li').attr('id'));
				//console.log(lastnode);
			}
		});
		
		current_gametree_id = initial_handle.id;
		var initially_selected_node = initial_handle.id + "_" + 0;
		
		domtree.jstree({
				"core": { "animation": 0, "html_titles": true },
				"ui": { "initially_select" : [ initially_selected_node ], "select_limit": 1 },
				"types" : {
											"valid_children" : [ "all" ],
											"types" : {
													"singleton_before" : {
															"icon" : {
																	"image" : "pics/move_before.png"
															},
															"valid_children" : [ "all" ],
															"max_depth" : 2,
															"hover_node" : false,
															"select_node" : function () {return true;}
													},
													"singleton_after" : {
															"icon" : {
																	"image" : "pics/move_after.png"
															},
															"valid_children" : [ "all" ],
															"max_depth" : 2,
															"hover_node" : false,
															"select_node" : function () {return true;}
													},
													"gsingleton_before" : {
															"icon" : {
																	"image" : "pics/gmove_before.png"
															},
															"valid_children" : [ "all" ],
															"max_depth" : 2,
															"hover_node" : false,
															"select_node" : function () {return true;}
													},
													"gsingleton_after" : {
															"icon" : {
																	"image" : "pics/gmove_after.png"
															},
															"valid_children" : [ "all" ],
															"max_depth" : 2,
															"hover_node" : false,
															"select_node" : function () {return true;}
													},
													"ssingleton_before" : {
															"icon" : {
																	"image" : "pics/smove_before.png"
															},
															"valid_children" : [ "all" ],
															"max_depth" : 2,
															"hover_node" : false,
															"select_node" : function () {return true;}
													},
													"ssingleton_after" : {
															"icon" : {
																	"image" : "pics/smove_after.png"
															},
															"valid_children" : [ "all" ],
															"max_depth" : 2,
															"hover_node" : false,
															"select_node" : function () {return true;}
													},

													"gmove_before" : {
															"icon" : {
																	"image" : "pics/gmove_before.png"
															},
															"valid_children" : [ "all" ],
															"max_depth" : 2,
															"hover_node" : false,
															"select_node" : function () {return true;}
													},
													"gmove_after" : {
															"icon" : {
																	"image" : "pics/gmove_after.png"
															},
															"valid_children" : [ "all" ],
															"max_depth" : 2,
															"hover_node" : false,
															"select_node" : function () {return true;}
													},
													"smove_before" : {
															"icon" : {
																	"image" : "pics/smove_before.png"
															},
															"valid_children" : [ "all" ],
															"max_depth" : 2,
															"hover_node" : false,
															"select_node" : function () {return true;}
													},
													"smove_after" : {
															"icon" : {
																	"image" : "pics/smove_after.png"
															},
															"valid_children" : [ "all" ],
															"max_depth" : 2,
															"hover_node" : false,
															"select_node" : function () {return true;}
													},
													
													"default" : {
															"valid_children" : [ "default" ]
													}
											}
									},				
					"plugins" : [ "themes", "html_data", "ui", "crrm", "types" ]
			});
		
			GENERIC.for_each(gametree.get_nodehandles(), function(nodehandle) {
				for(var i = 0; i < nodehandle.moves_from_node.length; ++i) {
					var nodetype = nodehandle.gamestate.turn === ARIMAA.gold ? "gmove_before" : "smove_before";
					var move_index = i;
					var selector = "#" + nodehandle.id + "_" + move_index;
					//console.log(selector);
					domtree.jstree('set_type', nodetype, selector);
					current_domtree_node = $(selector);
				}
			});
  }
  
  function refresh_domtree() {
  	//return;
  	console.log("refreshing");
		domtree.jstree('refresh');
  }
  
  function create_tree_nodehandle(nodehandle, move_index) {
  	
		var movename = nodehandle.moves_from_node.length === 0 ? 
										nodehandle.gamestate.turn.side.slice(0, 1) + "#"
									: nodehandle.moves_from_node[0].id /* show main variant */;

		if(nodehandle.moves_from_node.length > 0) {
			movename = "<strong>" + movename + "</strong>&nbsp;" + GENERIC.reduce("", nodehandle.moves_from_node[0].steps, function(result, step) { return step.notated + " " + result; });
			if(movename.length > 50) {
			  movename = movename.slice(0, 50) + "...";
			}
		}
									
		var side = nodehandle.gamestate.turn.side;									 

  	var result = '';
  	result += '<ul>';
			result += '<li id="' + nodehandle.id + "_" + move_index + '">';
			result += '<a href="#">' + movename + '</a>';
			result += '</li>';
  	result += '</ul>';
  	return $(result);
  }
  
  
	function import_game() {
		var notated_game = $('#imported_game').val();

		if(notated_game === "") {
			notated_game = example_game;
		}
		board = empty_board();
		
		var structured_moves = TRANSLATOR.convert_to_gametree(notated_game);
		var moves = generate_moves(structured_moves);
		build_move_tree(moves);
					
		show_board(board);
	}

	function bind_import_game() {
		$('#import_game').click(import_game);
	}
	
	function gametree_goto(id) {
		current_gametree_id = id;
		
		var node = gametree.select_node(id);
		
		board = node.board;
		gamestate = node.gamestate;
	}
	
	$(function() {
		domtree = $('.gametree');
		create_tree_and_viewer(domtree);
		
		bind_import_game();

		bind_control_move();

		show_board(board);
		//show_gametree();
		bind_select_piece();
		bind_move_piece();
		
		$('.arrownormal').mouseover(function() {
			$(this).hide();
			$(this).closest('.arrow').find('.arrowhover').show();		
		});
		
		$('.arrowhover').mouseout(function() {
			$(this).hide();
			$(this).closest('.arrow').find('.arrownormal').show();		
		});
		
		$('.show').click(function() {
				if(showing_slowly) return;
				showing_slowly = true;
				show_next_move_slowly();
		});
		
		$('.comments_for_node').focusout(function() {
				var comment = $(this).val();

				gametree.comment_node(comment, current_gametree_id);
		});
		
		
	  import_game();		
	});
		
	
}();